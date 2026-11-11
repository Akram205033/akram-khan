import React, { useState, useMemo } from 'react';
import {
  Product,
  CustomerOrder,
  CustomerOrderItem,
  OrderPaymentPreference,
  OrderStatus,
  ShopSettings,
  AppUser,
} from '../types/pos';
import { formatMoney, formatDateTime, generateInvoiceNumber } from '../utils/formatters';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Truck,
  Tractor,
  Clock,
  ArrowRight,
  Phone,
  MapPin,
  FileCheck,
  Package,
  Layers,
  X,
  CreditCard,
  UserCheck,
} from 'lucide-react';

interface CustomerPortalViewProps {
  products: Product[];
  orders: CustomerOrder[];
  settings: ShopSettings;
  currentUser: AppUser | null;
  ordersCount: number;
  onPlaceOrder: (order: CustomerOrder) => void;
  onUpdateOrderStatus: (orderId: number, status: OrderStatus) => void;
  onConvertOrderToSale: (order: CustomerOrder) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  products,
  orders,
  settings,
  currentUser,
  ordersCount,
  onPlaceOrder,
  onUpdateOrderStatus,
  onConvertOrderToSale,
}) => {
  // Mode: 'catalog' (Customer Shopping View) OR 'orders' (Admin / Staff Management Queue)
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>(
    currentUser?.role === 'customer' ? 'catalog' : 'orders'
  );

  // Customer Catalog State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [orderCart, setOrderCart] = useState<{ [productId: number]: number }>({});
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Checkout Form State
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState('রংপুর সদর');
  const [vehicleModel, setVehicleModel] = useState('');
  const [paymentPreference, setPaymentPreference] =
    useState<OrderPaymentPreference>('Cash_on_Delivery');
  const [orderNotes, setOrderNotes] = useState('');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<CustomerOrder | null>(null);

  // Admin Queue Filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');

  // Filtered products for customer catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.banglaName && p.banglaName.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.compatibleVehicles &&
          p.compatibleVehicles.some((v) => v.toLowerCase().includes(q)));

      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculation
  const cartItems = useMemo(() => {
    const list: Array<{ product: Product; qty: number; lineTotal: number }> = [];
    Object.entries(orderCart).forEach(([prodId, qty]) => {
      if (qty > 0) {
        const prod = products.find((p) => p.id === Number(prodId));
        if (prod) {
          list.push({ product: prod, qty, lineTotal: qty * prod.sellingPrice });
        }
      }
    });
    return list;
  }, [orderCart, products]);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, it) => sum + it.lineTotal, 0);
  }, [cartItems]);

  const deliveryFee = paymentPreference === 'Store_Pickup' ? 0 : 80;
  const grandTotal = cartSubtotal + deliveryFee;

  // Add / Adjust Cart
  const updateCartQty = (productId: number, newQty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    if (newQty > prod.stock) {
      alert(`স্টক সীমাবদ্ধতা: সর্বোচ্চ মজুত আছে ${prod.stock} ${prod.unit}`);
      return;
    }

    setOrderCart((prev) => {
      const updated = { ...prev };
      if (newQty <= 0) {
        delete updated[productId];
      } else {
        updated[productId] = newQty;
      }
      return updated;
    });
  };

  // Place Order Submit
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('আপনার কার্ট খালি!');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      alert('অনুগ্রহ করে আপনার নাম ও মোবাইল নম্বর লিখুন।');
      return;
    }

    const orderNo = generateInvoiceNumber('DM-ORD', ordersCount);
    const orderItems: CustomerOrderItem[] = cartItems.map((it) => ({
      productId: it.product.id,
      productName: it.product.name,
      qty: it.qty,
      unit: it.product.unit,
      unitPrice: it.product.sellingPrice,
      lineTotal: it.lineTotal,
    }));

    const newOrder: CustomerOrder = {
      id: Date.now(),
      orderNo,
      customerId: currentUser?.customerId || null,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      vehicleModel: vehicleModel.trim() || undefined,
      orderDate: new Date().toISOString(),
      status: 'pending',
      items: orderItems,
      subtotal: cartSubtotal,
      deliveryFee,
      total: grandTotal,
      paymentPreference,
      notes: orderNotes.trim() || undefined,
    };

    onPlaceOrder(newOrder);

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    setLastPlacedOrder(newOrder);
    setOrderCart({});
    setShowCheckoutModal(false);
  };

  // Filtered Admin Queue
  const filteredOrders = useMemo(() => {
    return orders.filter(
      (ord) => statusFilter === 'ALL' || ord.status === statusFilter
    );
  }, [orders, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <ShoppingBag className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              কাস্টমার অনলাইন ক্যাটালগ ও অর্ডার ম্যানেজমেন্ট
            </h2>
            <p className="text-xs text-slate-400">
              গ্রাহকদের সরাসরি অর্ডার পোর্টাল ও দোকানের অনলাইন অর্ডার কিউ
            </p>
          </div>
        </div>

        {/* Tab Switch */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🛒 গ্রাহক পার্টস ক্যাটালগ (Live Store)
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors relative ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📦 অর্ডার ম্যানেজমেন্ট ({orders.filter((o) => o.status === 'pending').length} অপেক্ষমাণ)
          </button>
        </div>
      </div>

      {/* VIEW 1: Customer Facing Shopping Catalog */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Products List (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            {/* Search & Category Filter */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="পার্টসের নাম, গাড়ির মডেল (মাহিন্দ্রা, সোনালিকা, মেসি ফার্গুসন) দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-100 placeholder-slate-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'ALL', label: 'সকল পার্টস' },
                  { id: 'Bearing', label: 'বিয়ারিং' },
                  { id: 'Tractor Parts', label: 'ট্র্যাক্টর পার্টস' },
                  { id: 'Engine Parts', label: 'ইঞ্জিন পার্টস' },
                  { id: 'Tyre', label: 'টায়ার' },
                  { id: 'Lubricant', label: 'লুব্রিকেন্ট ও মবিল' },
                  { id: 'Electrical', label: 'ইলেকট্রিক্যাল' },
                  { id: 'Brake & Clutch', label: 'ব্রেক ও ক্লাচ' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-colors ${
                      selectedCategory === c.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const inCartQty = orderCart[p.id] || 0;
                const isOutOfStock = p.stock <= 0;

                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {isOutOfStock ? 'স্টক শেষ' : `মজুত: ${p.stock} ${p.unit}`}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-white leading-snug line-clamp-2">
                        {p.name}
                      </h4>
                      {p.banglaName && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {p.banglaName}
                        </p>
                      )}

                      {p.compatibleVehicles && p.compatibleVehicles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.compatibleVehicles.slice(0, 2).map((v, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-amber-400 border border-amber-500/20"
                            >
                              <Tractor className="w-2.5 h-2.5" />
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-none">
                          বিক্রয় মূল্য
                        </span>
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          {formatMoney(p.sellingPrice, settings.currencySymbol)}
                        </span>
                      </div>

                      {/* Add to Cart or Stepper */}
                      {inCartQty === 0 ? (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => updateCartQty(p.id, 1)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors ${
                            isOutOfStock
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>অর্ডার করুন</span>
                        </button>
                      ) : (
                        <div className="flex items-center bg-slate-950 border border-amber-500/50 rounded-xl">
                          <button
                            type="button"
                            onClick={() => updateCartQty(p.id, inCartQty - 1)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono font-bold text-xs text-amber-400">
                            {inCartQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(p.id, inCartQty + 1)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Order Cart Drawer (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                আপনার অর্ডার তালিকা ({cartItems.length})
              </h3>
              {cartItems.length > 0 && (
                <button
                  onClick={() => setOrderCart({})}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  খালি করুন
                </button>
              )}
            </div>

            {/* Cart Items */}
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  কোনো পার্টস কার্টে যোগ করেননি। ক্যাটালগ থেকে "অর্ডার করুন" বাটনে চাপুন।
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {formatMoney(item.product.sellingPrice, settings.currencySymbol)} x {item.qty} {item.product.unit}
                      </div>
                    </div>

                    <div className="font-mono font-bold text-amber-400 whitespace-nowrap">
                      {formatMoney(item.lineTotal, settings.currencySymbol)}
                    </div>

                    <button
                      type="button"
                      onClick={() => updateCartQty(item.product.id, 0)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Summary Box */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>মালের মূল্য (Subtotal):</span>
                <span className="font-mono font-bold text-white">
                  {formatMoney(cartSubtotal, settings.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-mono text-slate-300">
                  {deliveryFee > 0 ? formatMoney(deliveryFee, settings.currencySymbol) : 'বিনামূল্যে'}
                </span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold text-sm pt-2 border-t border-slate-800">
                <span>সর্বমোট দেয় টাকা:</span>
                <span className="font-mono text-base">
                  {formatMoney(grandTotal, settings.currencySymbol)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={() => setShowCheckoutModal(true)}
              className="w-full py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <span>অর্ডার সম্পন্ন করতে এগিয়ে যান</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: Shop Admin / Staff Orders Management Queue */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Status Bar */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">অর্ডার স্ট্যাটাস ফিল্টার:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['ALL', 'pending', 'confirmed', 'ready', 'delivered', 'cancelled'] as Array<'ALL' | OrderStatus>).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    statusFilter === st
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st === 'ALL'
                    ? 'সকল অর্ডার'
                    : st === 'pending'
                    ? 'অপেক্ষমাণ'
                    : st === 'confirmed'
                    ? 'নিশ্চিতকৃত'
                    : st === 'ready'
                    ? 'প্রস্তুত'
                    : st === 'delivered'
                    ? 'ডেলিভার্ড'
                    : 'বাতিল'}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-4">অর্ডার নং</th>
                    <th className="py-3 px-3">তারিখ</th>
                    <th className="py-3 px-3">গ্রাহকের নাম ও ফোন</th>
                    <th className="py-3 px-3">গাড়ি মডেল</th>
                    <th className="py-3 px-3">অর্ডারকৃত পণ্যসমূহ</th>
                    <th className="py-3 px-3 text-right">মোট টাকা</th>
                    <th className="py-3 px-3 text-center">স্ট্যাটাস</th>
                    <th className="py-3 px-4 text-center">ব্যবস্থা গ্রহণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        কোনো অনলাইন কাস্টমার অর্ডার পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          {ord.orderNo}
                          {ord.convertedSaleInvoice && (
                            <span className="block text-[9px] text-emerald-400">
                              (ইনভয়েস: {ord.convertedSaleInvoice})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {formatDateTime(ord.orderDate)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{ord.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{ord.customerPhone}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{ord.deliveryAddress}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {ord.vehicleModel || 'সাধারণ'}
                        </td>
                        <td className="py-3 px-3 text-slate-300 max-w-[200px] truncate">
                          {ord.items.map((it) => `${it.productName} (${it.qty} ${it.unit})`).join(', ')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                          {formatMoney(ord.total, settings.currencySymbol)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : ord.status === 'confirmed'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : ord.status === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {ord.status === 'pending'
                              ? 'অপেক্ষমাণ'
                              : ord.status === 'confirmed'
                              ? 'কনফার্মড'
                              : ord.status === 'delivered'
                              ? 'ডেলিভার্ড'
                              : 'বাতিল'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Convert to Sale Button */}
                            {!ord.convertedSaleInvoice && ord.status !== 'cancelled' && (
                              <button
                                onClick={() => onConvertOrderToSale(ord)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm flex items-center gap-1"
                                title="সেলস মেমোতে রূপান্তর করুন"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>ইনভয়েস করুন</span>
                              </button>
                            )}

                            {ord.status === 'pending' && (
                              <button
                                onClick={() => onUpdateOrderStatus(ord.id, 'confirmed')}
                                className="px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/40"
                              >
                                অনুমোদন
                              </button>
                            )}

                            {ord.status !== 'cancelled' && !ord.convertedSaleInvoice && (
                              <button
                                onClick={() => onUpdateOrderStatus(ord.id, 'cancelled')}
                                className="p-1 rounded text-slate-500 hover:text-rose-400"
                                title="বাতিল করুন"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                অর্ডার ডেলিভারি ও কাস্টমার তথ্য
              </h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    আপনার নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: হাজী আব্দুল কাদের"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  ট্র্যাক্টর বা গাড়ির মডেল (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: Mahindra 575 DI / Sonalika 60"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  ডেলিভারির সম্পূর্ণ ঠিকানা *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="গ্রাম / বাজার, উপজেলা, জেলা"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  পেমেন্ট পদ্ধতি পছন্দ করুন
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentPreference('Cash_on_Delivery')}
                    className={`p-2 rounded-xl border text-center transition-colors ${
                      paymentPreference === 'Cash_on_Delivery'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    ক্যাশ অন ডেলিভারি
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentPreference('bKash')}
                    className={`p-2 rounded-xl border text-center transition-colors ${
                      paymentPreference === 'bKash'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    বিকাশ অগ্রিম
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentPreference('Store_Pickup')}
                    className={`p-2 rounded-xl border text-center transition-colors ${
                      paymentPreference === 'Store_Pickup'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    দোকান থেকে গ্রহণ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  বিশেষ নির্দেশনা / নোট
                </label>
                <input
                  type="text"
                  placeholder="যেমন: দ্রুত পাঠাবেন / মেকানিক দিয়ে চেক করাবেন"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-white">সর্বমোট প্রদেয় বিল:</span>
                <span className="font-mono font-bold text-amber-400 text-base">
                  {formatMoney(grandTotal, settings.currencySymbol)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                >
                  অর্ডার নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal after Placing Order */}
      {lastPlacedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-bold text-white text-lg">অর্ডার সফলভাবে জমা হয়েছে!</h3>
              <p className="text-xs text-slate-400 mt-1">
                দুলাল মোটরস-এ অর্ডার করার জন্য ধন্যবাদ। দোকান থেকে শীঘ্রই আপনার নম্বরে কল দিয়ে কনফার্ম করা হবে।
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">অর্ডার নম্বর:</span>
                <span className="font-mono font-bold text-amber-400">{lastPlacedOrder.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">সর্বমোট বিল:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatMoney(lastPlacedOrder.total, settings.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">পদ্ধতি:</span>
                <span>{lastPlacedOrder.paymentPreference}</span>
              </div>
            </div>

            <button
              onClick={() => setLastPlacedOrder(null)}
              className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
