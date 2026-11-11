import React, { useState, useMemo } from 'react';
import {
  Purchase,
  PurchaseItem,
  Supplier,
  Product,
  PaymentMethod,
  ShopSettings,
} from '../types/pos';
import { formatMoney, formatDateTime, generateInvoiceNumber } from '../utils/formatters';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  Trash2,
  Eye,
  CheckCircle2,
  HandCoins,
} from 'lucide-react';

interface PurchasesViewProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  products: Product[];
  settings: ShopSettings;
  purchasesCount: number;
  onAddPurchase: (purchase: Purchase, updatedProducts: Product[]) => void;
  onAddSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  onPaySupplier: (supplierId: number, amount: number, method: PaymentMethod, note: string) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  suppliers,
  products,
  settings,
  purchasesCount,
  onAddPurchase,
  onAddSupplier,
  onPaySupplier,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'suppliers'>('list');

  // New Purchase Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [customInvoiceNo, setCustomInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseItems, setPurchaseItems] = useState<
    { productId: number; productName: string; qty: number; unit: string; unitCost: number }[]
  >([]);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [purchaseNote, setPurchaseNote] = useState('');

  // Row item addition
  const [currProductId, setCurrProductId] = useState<number | ''>('');
  const [currQty, setCurrQty] = useState<string>('1');
  const [currCost, setCurrCost] = useState<string>('');

  // New Supplier Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supName, setSupName] = useState('');
  const [supCompany, setSupCompany] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Pay Supplier Modal
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payNote, setPayNote] = useState<string>('');

  // View purchase items modal
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  // Auto populate cost when product is selected in item row
  const handleProductSelect = (id: number | '') => {
    setCurrProductId(id);
    if (id) {
      const prod = products.find((p) => p.id === id);
      if (prod) {
        setCurrCost(prod.purchasePrice.toString());
      }
    }
  };

  const handleAddItemToPurchase = () => {
    if (!currProductId) {
      alert('অনুগ্রহ করে পণ্য নির্বাচন করুন।');
      return;
    }
    const q = parseFloat(currQty);
    const c = parseFloat(currCost);
    if (isNaN(q) || q <= 0) {
      alert('সঠিক পরিমাণ লিখুন।');
      return;
    }
    if (isNaN(c) || c < 0) {
      alert('সঠিক ক্রয়মূল্য লিখুন।');
      return;
    }

    const prod = products.find((p) => p.id === currProductId);
    if (!prod) return;

    setPurchaseItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        qty: q,
        unit: prod.unit,
        unitCost: c,
      },
    ]);

    setCurrProductId('');
    setCurrQty('1');
    setCurrCost('');
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalPurchaseBill = useMemo(() => {
    return purchaseItems.reduce((sum, it) => sum + it.qty * it.unitCost, 0);
  }, [purchaseItems]);

  const effectivePaid = useMemo(() => {
    if (paidAmount === '') return totalPurchaseBill;
    const val = parseFloat(paidAmount);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [paidAmount, totalPurchaseBill]);

  const purchaseDue = Math.max(0, totalPurchaseBill - effectivePaid);

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0) {
      alert('ক্রয় তালিকায় কমপক্ষে একটি পণ্য যোগ করুন।');
      return;
    }

    const supplier = suppliers.find((s) => s.id === Number(selectedSupplierId));
    const purchaseNo = customInvoiceNo.trim() || generateInvoiceNumber('DM-P', purchasesCount);

    const items: PurchaseItem[] = purchaseItems.map((it, idx) => ({
      id: idx + 1,
      purchaseId: purchasesCount + 1,
      productId: it.productId,
      productName: it.productName,
      qty: it.qty,
      unit: it.unit,
      unitCost: it.unitCost,
      lineTotal: it.qty * it.unitCost,
    }));

    // Increment product stock and update purchase price
    const updatedProducts = products.map((p) => {
      const match = purchaseItems.find((it) => it.productId === p.id);
      if (match) {
        return {
          ...p,
          stock: p.stock + match.qty,
          purchasePrice: match.unitCost, // update latest purchase cost
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    const newPurchase: Purchase = {
      id: Date.now(),
      purchaseNo,
      supplierId: supplier ? supplier.id : null,
      supplierName: supplier ? supplier.name : undefined,
      purchaseDate: new Date(purchaseDate).toISOString(),
      total: totalPurchaseBill,
      paid: effectivePaid,
      due: purchaseDue,
      paymentMethod,
      note: purchaseNote.trim() || undefined,
      items,
    };

    onAddPurchase(newPurchase, updatedProducts);
    alert(`ক্রয় এন্ট্রি সফল হয়েছে! ইনভয়েস: ${purchaseNo}`);

    // Reset
    setPurchaseItems([]);
    setSelectedSupplierId('');
    setCustomInvoiceNo('');
    setPaidAmount('');
    setPurchaseNote('');
    setActiveTab('list');
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      alert('মহাজন বা কোম্পানির নাম লিখুন।');
      return;
    }

    const created = onAddSupplier({
      name: supName.trim(),
      company: supCompany.trim() || supName.trim(),
      phone: supPhone.trim(),
      address: supAddress.trim(),
    });

    setSelectedSupplierId(created.id);
    setShowSupplierModal(false);
    setSupName('');
    setSupCompany('');
    setSupPhone('');
    setSupAddress('');
  };

  const handleSupplierPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier) return;
    const amount = parseFloat(payAmountInput);
    if (isNaN(amount) || amount <= 0) {
      alert('সঠিক টাকার অঙ্ক লিখুন।');
      return;
    }

    onPaySupplier(payingSupplier.id, amount, payMethod, payNote.trim());
    alert(`মহাজন "${payingSupplier.name}" কে ${formatMoney(amount, settings.currencySymbol)} পরিশোধ করা হয়েছে।`);
    setPayingSupplier(null);
    setPayAmountInput('');
    setPayNote('');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Truck className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              মহাজন ক্রয় এন্ট্রি ও সাপ্লায়ার দেনা
            </h2>
            <p className="text-xs text-slate-400">
              চালান এন্ট্রি দিলে স্বয়ংক্রিয়ভাবে পণ্যের স্টক বৃদ্ধি পাবে
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ক্রয় তালিকা ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'add'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            + নতুন ক্রয় চালান
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'suppliers'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            মহাজন / সাপ্লায়ার তালিকা ({suppliers.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Purchases List */}
      {activeTab === 'list' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>সর্বমোট ক্রয় ইনভয়েস: {purchases.length} টি</span>
            <span className="font-mono text-rose-400 font-semibold">
              মোট মহাজন বকেয়া: {formatMoney(purchases.reduce((s, p) => s + p.due, 0), settings.currencySymbol)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">চালান নং</th>
                  <th className="py-3 px-3">তারিখ</th>
                  <th className="py-3 px-3">মহাজন / সাপ্লায়ার</th>
                  <th className="py-3 px-3 text-center">আইটেম সংখ্যা</th>
                  <th className="py-3 px-3 text-right">মোট ক্রয়মূল্য</th>
                  <th className="py-3 px-3 text-right">নগদ প্রদান</th>
                  <th className="py-3 px-3 text-right">দেনা / বাকি</th>
                  <th className="py-3 px-4 text-center">বিবরণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                      এখনো কোনো ক্রয় চালান এন্ট্রি হয়নি।
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        {p.purchaseNo}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {formatDateTime(p.purchaseDate)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {p.supplierName || 'সাধারণ বিক্রেতা'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {p.items?.length || 0} টি
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {formatMoney(p.total, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">
                        {formatMoney(p.paid, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                        {p.due > 0 ? formatMoney(p.due, settings.currencySymbol) : '০.০০'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setViewingPurchase(p)}
                          className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title="পণ্যগুলোর তালিকা দেখুন"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: New Purchase Entry Form */}
      {activeTab === 'add' && (
        <form onSubmit={handleSubmitPurchase} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Purchase Info & Items Table (8 cols) */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center justify-between">
                <span>নতুন মালামাল ক্রয় চালান</span>
                <span className="text-xs text-amber-400 font-mono">
                  {customInvoiceNo || 'Auto Gen Number'}
                </span>
              </h3>

              {/* Supplier & Invoice metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-medium">মহাজন / সাপ্লায়ার *</label>
                    <button
                      type="button"
                      onClick={() => setShowSupplierModal(true)}
                      className="text-amber-400 hover:underline font-bold text-[11px]"
                    >
                      + নতুন
                    </button>
                  </div>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) =>
                      setSelectedSupplierId(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- মহাজন নির্বাচন --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    চালান / ইনভয়েস নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: INV-7892"
                    value={customInvoiceNo}
                    onChange={(e) => setCustomInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">ক্রয় তারিখ</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Add item row */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  চালানে পণ্য যোগ করুন
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <select
                      value={currProductId}
                      onChange={(e) =>
                        handleProductSelect(e.target.value ? Number(e.target.value) : '')
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- পণ্য সিলেক্ট করুন --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (বর্তমান স্টক: {p.stock} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="পরিমাণ"
                      value={currQty}
                      onChange={(e) => setCurrQty(e.target.value)}
                      className="w-full px-2 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="ক্রয়দর ৳"
                      value={currCost}
                      onChange={(e) => setCurrCost(e.target.value)}
                      className="w-full px-2 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-right focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItemToPurchase}
                      className="w-full h-full py-2 px-3 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-colors"
                    >
                      যোগ করুন
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">পণ্য</th>
                      <th className="py-2.5 px-2 text-center">পরিমাণ</th>
                      <th className="py-2.5 px-2 text-right">ক্রয়দর</th>
                      <th className="py-2.5 px-3 text-right">মোট</th>
                      <th className="py-2.5 px-2 text-center">বাদ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {purchaseItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                          কোনো পণ্য যোগ করা হয়নি। উপরের বক্স থেকে পণ্য যোগ করুন।
                        </td>
                      </tr>
                    ) : (
                      purchaseItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-medium text-white">{item.productName}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-300">
                            {item.qty} {item.unit}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-400">
                            {formatMoney(item.unitCost, settings.currencySymbol)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {formatMoney(item.qty * item.unitCost, settings.currencySymbol)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Payment & Summary (4 cols) */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-800">
                পেমেন্ট ও চালান সারসংক্ষেপ
              </h3>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>মোট ক্রয় বিল:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {formatMoney(totalPurchaseBill, settings.currencySymbol)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    পেমেন্ট মেথড
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="Cash">নগদ (Cash)</option>
                    <option value="Bank">ব্যাংক চেক / ট্রান্সফার</option>
                    <option value="bKash">বিকাশ / নগদ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    এখন পরিশোধ (Paid)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={totalPurchaseBill.toString()}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-emerald-400 font-bold focus:outline-none"
                  />
                </div>

                <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800">
                  <span>মহাজন দেনা (Due):</span>
                  <span className="font-mono font-bold text-rose-400">
                    {formatMoney(purchaseDue, settings.currencySymbol)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  চালান নোট
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: ট্রাক নম্বর / ড্রাইভার বিল..."
                  value={purchaseNote}
                  onChange={(e) => setPurchaseNote(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={purchaseItems.length === 0}
                className="w-full py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                ক্রয় চালান নিশ্চিত করুন
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Suppliers Directory & Pay Modal */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">
              মহাজনদের তালিকা ও দেনা খতিয়ান
            </span>
            <button
              onClick={() => setShowSupplierModal(true)}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm"
            >
              + নতুন মহাজন যোগ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {suppliers.map((s) => {
              const supplierPurchases = purchases.filter((p) => p.supplierId === s.id);
              const totalPurchased = supplierPurchases.reduce((sum, p) => sum + p.total, 0);
              const totalPaid = supplierPurchases.reduce((sum, p) => sum + p.paid, 0);
              const netDue = Math.max(0, totalPurchased - totalPaid);

              return (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{s.name}</h4>
                        <div className="text-xs text-amber-400 font-medium">{s.company}</div>
                      </div>
                      <span className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                      <div>ফোন: {s.phone || 'দেওয়া হয়নি'}</div>
                      <div>ঠিকানা: {s.address || 'দেওয়া হয়নি'}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">মোট ক্রয়:</span>
                      <span className="font-mono font-medium text-slate-200">
                        {formatMoney(totalPurchased, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400">বর্তমান দেনা:</span>
                      <span
                        className={`font-mono font-bold ${
                          netDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {formatMoney(netDue, settings.currencySymbol)}
                      </span>
                    </div>

                    {netDue > 0 && (
                      <button
                        onClick={() => {
                          setPayingSupplier(s);
                          setPayAmountInput(netDue.toString());
                        }}
                        className="w-full py-1.5 rounded-xl font-bold text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
                      >
                        দেনা পরিশোধ করুন
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              নতুন মহাজন / সাপ্লায়ার নিবন্ধন
            </h3>

            <form onSubmit={handleCreateSupplier} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  মহাজনের নাম / মালিকের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: হাজী আবুল কাশেম"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  কোম্পানি / এজেন্সির নাম
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বেঙ্গল বিয়ারিং ডিস্ট্রিবিউশন"
                  value={supCompany}
                  onChange={(e) => setSupCompany(e.target.value)}
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
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  ঠিকানা
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: নওয়াবপুর রোড, ঢাকা"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {payingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-rose-400" />
              মহাজন দেনা পরিশোধ
            </h3>

            <div className="p-3 my-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="font-semibold text-white">{payingSupplier.name}</div>
              <div className="text-amber-400">{payingSupplier.company}</div>
            </div>

            <form onSubmit={handleSupplierPaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  পরিশোধের পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-emerald-400 font-bold focus:outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  পেমেন্ট মেথড
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                >
                  <option value="Cash">নগদ (Cash)</option>
                  <option value="Bank">ব্যাংক চেক / অ্যাকাউন্ট</option>
                  <option value="bKash">বিকাশ / নগদ</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">মন্তব্য</label>
                <input
                  type="text"
                  placeholder="যেমন: চেক নং #10492"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayingSupplier(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-rose-500 hover:bg-rose-400 text-white"
                >
                  পরিশোধ সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">চালান বিবরণী</h3>
                <span className="font-mono text-xs text-amber-400">{viewingPurchase.purchaseNo}</span>
              </div>
              <button
                onClick={() => setViewingPurchase(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="py-3 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>সাপ্লায়ার:</span>
                <span className="font-semibold text-white">{viewingPurchase.supplierName || '—'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>তারিখ:</span>
                <span className="text-slate-300">{formatDateTime(viewingPurchase.purchaseDate)}</span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl my-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[10px] uppercase">
                    <th className="p-2">পণ্য</th>
                    <th className="p-2 text-center">পরিমাণ</th>
                    <th className="p-2 text-right">দর</th>
                    <th className="p-2 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {viewingPurchase.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium text-white">{it.productName}</td>
                      <td className="p-2 text-center font-mono text-slate-300">
                        {it.qty} {it.unit}
                      </td>
                      <td className="p-2 text-right font-mono text-slate-400">{it.unitCost}</td>
                      <td className="p-2 text-right font-mono font-bold text-white">
                        {it.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-xs flex justify-between font-bold text-white">
              <span>সর্বমোট:</span>
              <span className="font-mono text-amber-400 text-sm">
                {formatMoney(viewingPurchase.total, settings.currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
