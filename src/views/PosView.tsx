import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Product,
  Customer,
  CartItem,
  Sale,
  PaymentMethod,
  ShopSettings,
  ProductCategory,
} from '../types/pos';
import { formatMoney, generateInvoiceNumber } from '../utils/formatters';
import confetti from 'canvas-confetti';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Barcode,
  Layers,
  Sparkles,
  ArrowRight,
  Camera,
  QrCode,
  ScanLine,
} from 'lucide-react';
import { QrCameraScannerModal } from '../components/QrCameraScannerModal';

interface PosViewProps {
  products: Product[];
  customers: Customer[];
  settings: ShopSettings;
  salesCount: number;
  getCustomerDue: (customerId: number) => number;
  onCompleteSale: (sale: Sale, updatedProducts: Product[]) => void;
  onAddNewCustomer: (newCustomer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'ALL', label: 'সব ক্যাটেগরি' },
  { id: 'Bearing', label: 'বিয়ারিং' },
  { id: 'Tractor Parts', label: 'ট্র্যাক্টর পার্টস' },
  { id: 'Engine Parts', label: 'ইঞ্জিন পার্টস' },
  { id: 'Tyre', label: 'টায়ার ও টিউব' },
  { id: 'Lubricant', label: 'লুব্রিকেন্ট ও মবিল' },
  { id: 'Electrical', label: 'ইলেকট্রিক্যাল' },
  { id: 'Brake & Clutch', label: 'ব্রেক ও ক্লাচ' },
  { id: 'Hardware & Other', label: 'হার্ডওয়্যার ও অন্যান্য' },
];

export const PosView: React.FC<PosViewProps> = ({
  products,
  customers,
  settings,
  salesCount,
  getCustomerDue,
  onCompleteSale,
  onAddNewCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [saleNote, setSaleNote] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Quick Customer Add Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustVehicle, setNewCustVehicle] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (F2 to open QR Scanner)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsScannerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.banglaName && p.banglaName.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.location && p.location.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Selected customer info
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const customerPreviousDue = useMemo(() => {
    if (!selectedCustomerId) return 0;
    return getCustomerDue(selectedCustomerId);
  }, [selectedCustomerId, getCustomerDue]);

  // Cart math
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [cart]);

  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * Math.min(100, Math.max(0, discountValue))) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountValue, discountType]);

  const netTotal = Math.max(0, subtotal - calculatedDiscount);

  // If user hasn't explicitly typed paid amount, default to full cash payment if cash/bkash/bank, or 0 if Due
  const effectivePaidAmount = useMemo(() => {
    if (paymentMethod === 'Due') return 0;
    if (paidAmountInput === '') return netTotal;
    const val = parseFloat(paidAmountInput);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [paymentMethod, paidAmountInput, netTotal]);

  const dueAmount = Math.max(0, netTotal - effectivePaidAmount);
  const changeAmount = Math.max(0, effectivePaidAmount - netTotal);
  const grandTotalDue = customerPreviousDue + dueAmount;

  // Add item to cart
  const addToCart = (product: Product, qtyToAdd = 1) => {
    if (product.stock <= 0) {
      alert(`দুঃখিত, "${product.name}" এর স্টক শেষ!`);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx >= 0) {
        const item = prev[existingIdx];
        const newQty = item.qty + qtyToAdd;
        if (newQty > product.stock) {
          alert(`স্টক সতর্কতা: সর্বাধিক মজুত আছে ${product.stock} ${product.unit}`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = {
          ...item,
          qty: newQty,
          lineTotal: newQty * item.unitPrice,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            qty: qtyToAdd,
            unitPrice: product.sellingPrice,
            costPrice: product.purchasePrice,
            discount: 0,
            lineTotal: qtyToAdd * product.sellingPrice,
          },
        ];
      }
    });
  };

  // Update item quantity in cart
  const updateCartQty = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          if (newQty > item.product.stock) {
            alert(`স্টক সতর্কতা: সর্বাধিক মজুত আছে ${item.product.stock} ${item.product.unit}`);
            return item;
          }
          return {
            ...item,
            qty: newQty,
            lineTotal: newQty * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  // Update item unit price in cart
  const updateCartPrice = (productId: number, newPrice: number) => {
    if (newPrice < 0) return;
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            unitPrice: newPrice,
            lineTotal: item.qty * newPrice,
          };
        }
        return item;
      })
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('আপনি কি কার্টের সব পণ্য মুছে ফেলতে চান?')) {
      setCart([]);
      setDiscountValue(0);
      setPaidAmountInput('');
      setSaleNote('');
    }
  };

  // Barcode / SKU quick adder
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const term = barcodeInput.trim().toLowerCase();
    const found = products.find(
      (p) => p.sku.toLowerCase() === term || p.name.toLowerCase().includes(term)
    );

    if (found) {
      addToCart(found, 1);
      setBarcodeInput('');
    } else {
      alert(`"${barcodeInput}" কোডের কোনো পণ্য পাওয়া যায়নি!`);
    }
  };

  // Handle Quick Add Customer Submit
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      alert('কাস্টমারের নাম লিখুন।');
      return;
    }

    const created = onAddNewCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      vehicleType: newCustVehicle.trim() || undefined,
    });

    setSelectedCustomerId(created.id);
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustVehicle('');
  };

  // Complete Sale
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('কার্টে কোনো পণ্য যোগ করা হয়নি!');
      return;
    }

    if (dueAmount > 0 && !selectedCustomerId) {
      alert('বাকি বিক্রয় করতে হলে অনুগ্রহ করে কাস্টমার নির্বাচন করুন (অথবা নতুন কাস্টমার যোগ করুন)।');
      return;
    }

    // Check stock availability
    for (const item of cart) {
      if (item.qty > item.product.stock) {
        alert(
          `পণ্য "${item.product.name}" এর পর্যাপ্ত স্টক নেই। বর্তমান মজুত: ${item.product.stock} ${item.product.unit}`
        );
        return;
      }
    }

    const invoiceNo = generateInvoiceNumber('DM-S', salesCount);
    const saleDate = new Date().toISOString();

    const saleItems = cart.map((item, index) => ({
      id: index + 1,
      saleId: salesCount + 1,
      productId: item.product.id,
      productName: item.product.name,
      qty: item.qty,
      unit: item.product.unit,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      lineTotal: item.lineTotal,
    }));

    // Deduct stock from products
    const updatedProducts = products.map((p) => {
      const inCart = cart.find((item) => item.product.id === p.id);
      if (inCart) {
        return {
          ...p,
          stock: Math.max(0, p.stock - inCart.qty),
        };
      }
      return p;
    });

    const newSale: Sale = {
      id: Date.now(),
      invoiceNo,
      customerId: selectedCustomerId,
      customerName: selectedCustomer ? selectedCustomer.name : undefined,
      customerPhone: selectedCustomer ? selectedCustomer.phone : undefined,
      saleDate,
      subtotal,
      discount: calculatedDiscount,
      total: netTotal,
      paid: effectivePaidAmount,
      due: dueAmount,
      paymentMethod,
      note: saleNote.trim() || undefined,
      items: saleItems,
      previousDue: customerPreviousDue > 0 ? customerPreviousDue : undefined,
      totalCustomerDue: grandTotalDue > 0 ? grandTotalDue : undefined,
    };

    // Confetti effect
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // ignore if fails
    }

    onCompleteSale(newSale, updatedProducts);

    // Reset cart
    setCart([]);
    setDiscountValue(0);
    setPaidAmountInput('');
    setSaleNote('');
    setSelectedCustomerId(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Barcode Quick Add */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <ShoppingCart className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">
              সেলস কাউন্টার / POS টার্মিনাল
            </h2>
            <p className="text-xs text-slate-400">
              দ্রুত পণ্য নির্বাচন করুন অথবা বারকোড স্ক্যান করুন
            </p>
          </div>
        </div>

        {/* Controls: Camera Scanner + SKU Input */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* QR Code Scanner (Camera) Button */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-md shadow-amber-500/25 transition-all active:scale-95 whitespace-nowrap"
            title="ক্যামেরা দিয়ে QR ও বারকোড স্ক্যান করুন (F2)"
          >
            <Camera className="w-4 h-4" />
            <span>QR স্ক্যানার (ক্যামেরা)</span>
            <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/20 font-bold">
              F2
            </span>
          </button>

          {/* Quick SKU / Barcode Input Form */}
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 flex-1 md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Barcode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="SKU কোড / বারকোড (Enter)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:outline-none text-slate-100 placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors whitespace-nowrap"
            >
              যোগ করুন
            </button>
          </form>
        </div>
      </div>

      {/* Main Split: Left Product Catalog (7 cols) + Right Cart (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Product Catalog */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search bar & Category filters */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="পণ্যের নাম, বাংলা নাম, পার্ট নম্বর বা র্যাক খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-100 placeholder-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-amber-400 hover:text-amber-300 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-medium"
                title="ক্যামেরা দিয়ে QR কোড স্ক্যান করুন"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">ক্যামেরা স্ক্যান</span>
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
                কোনো পণ্য পাওয়া যায়নি।
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= p.minStock;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p, 1)}
                    className={`group relative p-3 rounded-xl border flex flex-col justify-between transition-all select-none ${
                      isOutOfStock
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                        : 'bg-slate-900 border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 cursor-pointer shadow-sm active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[100px]">
                          {p.sku}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-rose-500/10 text-rose-400'
                              : isLowStock
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {isOutOfStock
                            ? 'স্টক শেষ'
                            : `${p.stock} ${p.unit}`}
                        </span>
                      </div>

                      <h4 className="font-semibold text-xs text-white leading-snug line-clamp-2">
                        {p.name}
                      </h4>

                      {p.banglaName && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {p.banglaName}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-none">
                          বিক্রয় মূল্য
                        </span>
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          {formatMoney(p.sellingPrice, settings.currencySymbol)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                          isOutOfStock
                            ? 'bg-slate-800 text-slate-600'
                            : 'bg-amber-500 text-slate-950 group-hover:bg-amber-400'
                        }`}
                        title="কার্টে যোগ করুন"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Billing & Cart Drawer */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-3.5">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                <span className="font-bold text-white text-sm">
                  বিক্রয় কার্ট ({cart.reduce((sum, it) => sum + it.qty, 0)})
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
                >
                  কার্ট খালি করুন
                </button>
              )}
            </div>

            {/* Customer Selection Row */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-400 uppercase">
                  গ্রাহক নির্বাচন
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:underline"
                >
                  <UserPlus className="w-3 h-3" />
                  নতুন খদ্দের
                </button>
              </div>

              <select
                value={selectedCustomerId ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCustomerId(val ? Number(val) : null);
                }}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="">সাধারণ খদ্দের (Walk-in Customer)</option>
                {customers.map((c) => {
                  const due = getCustomerDue(c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || 'ফোন নেই'}) {due > 0 ? `— বকেয়া ৳${due}` : ''}
                    </option>
                  );
                })}
              </select>

              {/* Show Previous Due notice if customer has unpaid balance */}
              {customerPreviousDue > 0 && (
                <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <span>পূর্বের বকেয়া পাওনা:</span>
                  <span className="font-mono font-bold">
                    {formatMoney(customerPreviousDue, settings.currencySymbol)}
                  </span>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  কার্ট খালি। বাম পাশের তালিকা থেকে পণ্য যোগ করুন।
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs text-white truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-amber-400">
                          {formatMoney(item.unitPrice, settings.currencySymbol)}
                        </span>
                        <span>x</span>
                        <span className="text-slate-300 font-mono">
                          {item.qty} {item.product.unit}
                        </span>
                      </div>
                    </div>

                    {/* Stepper & Price adjust */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.product.stock}
                          value={item.qty}
                          onChange={(e) =>
                            updateCartQty(item.product.id, parseFloat(e.target.value) || 1)
                          }
                          className="w-10 text-center font-mono text-xs bg-transparent border-0 text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="font-mono font-bold text-xs text-white w-16 text-right">
                        {formatMoney(item.lineTotal, settings.currencySymbol)}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>মোট আইটেম মূল্য (Subtotal):</span>
                <span className="font-mono font-semibold text-white">
                  {formatMoney(subtotal, settings.currencySymbol)}
                </span>
              </div>

              {/* Discount Row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">ডিসকাউন্ট:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-xs text-right font-mono rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setDiscountType((prev) => (prev === 'fixed' ? 'percent' : 'fixed'))}
                    className="px-1.5 py-1 text-[11px] rounded bg-slate-800 text-amber-400 font-bold border border-slate-700"
                  >
                    {discountType === 'fixed' ? '৳' : '%'}
                  </button>
                </div>
              </div>

              {/* Net Total */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-bold text-white">
                <span>সর্বমোট বিল (Net Total):</span>
                <span className="font-mono text-amber-400 text-base">
                  {formatMoney(netTotal, settings.currencySymbol)}
                </span>
              </div>

              {/* Payment Method selector */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">
                  পেমেন্ট মাধ্যম
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['Cash', 'bKash', 'Bank', 'Due'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                        paymentMethod === method
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {method === 'Cash'
                        ? 'নগদ'
                        : method === 'bKash'
                        ? 'বিকাশ'
                        : method === 'Bank'
                        ? 'ব্যাংক'
                        : 'বাকি'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid Amount & Due Calculation */}
              {paymentMethod !== 'Due' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      টাকা গ্রহণ (Paid)
                    </label>
                    <input
                      type="number"
                      placeholder={netTotal.toString()}
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono rounded bg-slate-900 border border-slate-700 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      {changeAmount > 0 ? 'খদ্দেরকে ফেরত (Change)' : 'বর্তমান বাকি (Due)'}
                    </label>
                    <div
                      className={`px-2 py-1 text-xs font-mono font-bold rounded bg-slate-900 border ${
                        changeAmount > 0
                          ? 'text-cyan-400 border-cyan-500/30'
                          : dueAmount > 0
                          ? 'text-rose-400 border-rose-500/30'
                          : 'text-slate-400 border-slate-800'
                      }`}
                    >
                      {changeAmount > 0
                        ? formatMoney(changeAmount, settings.currencySymbol)
                        : formatMoney(dueAmount, settings.currencySymbol)}
                    </div>
                  </div>
                </div>
              )}

              {/* Grand Total Due Notice if customer has cumulative dues */}
              {selectedCustomer && (dueAmount > 0 || customerPreviousDue > 0) && (
                <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex justify-between items-center">
                  <span>সর্বমোট বকেয়া (পূর্বের+আজকের):</span>
                  <span className="font-mono font-bold text-xs">
                    {formatMoney(grandTotalDue, settings.currencySymbol)}
                  </span>
                </div>
              )}

              {/* Sale Note */}
              <input
                type="text"
                placeholder="নোট (যেমন: ট্র্যাক্টর চালক / গাড়ির নম্বর)..."
                value={saleNote}
                onChange={(e) => setSaleNote(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none placeholder-slate-500"
              />
            </div>
          </div>

          {/* Checkout Button */}
          <div className="pt-4 mt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                cart.length === 0
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20 active:scale-[0.99]'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.4]" />
              <span>বিক্রি সম্পন্ন ও ইনভয়েস তৈরি ({formatMoney(netTotal, settings.currencySymbol)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                নতুন কাস্টমার নিবন্ধন
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  কাস্টমারের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ কামরুল ইসলাম"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  গাড়ি / ট্র্যাক্টর মডেল
                </label>
                <input
                  type="text"
                  placeholder="যেমন: Mahindra 575 DI / Sonalika"
                  value={newCustVehicle}
                  onChange={(e) => setNewCustVehicle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  ঠিকানা
                </label>
                <textarea
                  rows={2}
                  placeholder="গ্রাম / এলাকা, উপজেলা"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera QR & Barcode Scanner Modal */}
      <QrCameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onProductScanned={(scannedProduct, qty = 1) => {
          addToCart(scannedProduct, qty);
        }}
        currencySymbol={settings.currencySymbol}
      />
    </div>
  );
};

