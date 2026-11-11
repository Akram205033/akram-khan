import React, { useState, useMemo } from 'react';
import { Customer, Collection, PaymentMethod, ShopSettings } from '../types/pos';
import {
  formatMoney,
  formatDateTime,
  generateCollectionReceiptSms,
  generateInvoiceNumber,
} from '../utils/formatters';
import {
  HandCoins,
  Search,
  CheckCircle2,
  Share2,
  Check,
  Receipt,
  User,
  Phone,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomerCollectionViewProps {
  customers: Customer[];
  collections: Collection[];
  settings: ShopSettings;
  collectionsCount: number;
  getCustomerDue: (customerId: number) => number;
  onAddCollection: (collection: Collection) => void;
  preSelectedCustomerId?: number | null;
}

export const CustomerCollectionView: React.FC<CustomerCollectionViewProps> = ({
  customers,
  collections,
  settings,
  collectionsCount,
  getCustomerDue,
  onAddCollection,
  preSelectedCustomerId,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(
    preSelectedCustomerId || ''
  );
  const [collectionAmount, setCollectionAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [collectionDate, setCollectionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [note, setNote] = useState<string>('');
  const [voucherNo, setVoucherNo] = useState<string>('');

  // Generated receipt modal/message state
  const [lastReceipt, setLastReceipt] = useState<{
    customerName: string;
    amount: number;
    remainingDue: number;
    voucher: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Selected customer details & due
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === Number(selectedCustomerId)) || null;
  }, [customers, selectedCustomerId]);

  const currentDue = useMemo(() => {
    if (!selectedCustomerId) return 0;
    return getCustomerDue(Number(selectedCustomerId));
  }, [selectedCustomerId, getCustomerDue]);

  // Customers with outstanding due
  const dueCustomers = useMemo(() => {
    return customers
      .map((c) => ({
        ...c,
        due: getCustomerDue(c.id),
      }))
      .filter((c) => c.due > 0)
      .sort((a, b) => b.due - a.due);
  }, [customers, getCustomerDue]);

  const handleSelectCustomer = (customerId: number | '') => {
    setSelectedCustomerId(customerId);
    if (customerId) {
      const due = getCustomerDue(customerId);
      setCollectionAmount(due > 0 ? due.toString() : '');
    } else {
      setCollectionAmount('');
    }
  };

  const handleSubmitCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedCustomer) {
      alert('অনুগ্রহ করে কাস্টমার নির্বাচন করুন।');
      return;
    }

    const amount = parseFloat(collectionAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('আদায়ের সঠিক পরিমাণ লিখুন।');
      return;
    }

    if (amount > currentDue) {
      if (!confirm(`আদায়ের পরিমাণ (${formatMoney(amount)}) বর্তমান বকেয়ার (${formatMoney(currentDue)}) চেয়ে বেশি। আপনি কি এগিয়ে যেতে চান?`)) {
        return;
      }
    }

    const voucher = voucherNo.trim() || generateInvoiceNumber('COL', collectionsCount);
    const newCollection: Collection = {
      id: Date.now(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      amount,
      collectionDate: new Date(collectionDate).toISOString(),
      method,
      note: note.trim() || undefined,
      voucherNo: voucher,
    };

    onAddCollection(newCollection);

    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (e) {}

    const remainingDue = Math.max(0, currentDue - amount);
    setLastReceipt({
      customerName: selectedCustomer.name,
      amount,
      remainingDue,
      voucher,
    });

    // Reset
    setSelectedCustomerId('');
    setCollectionAmount('');
    setNote('');
    setVoucherNo('');
  };

  const handleCopySms = () => {
    if (!lastReceipt) return;
    const sms = generateCollectionReceiptSms(
      lastReceipt.customerName,
      lastReceipt.amount,
      lastReceipt.remainingDue,
      lastReceipt.voucher,
      settings.shopNameBn
    );
    navigator.clipboard.writeText(sms);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <HandCoins className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              কাস্টমার বাকি আদায় (Collection)
            </h2>
            <p className="text-xs text-slate-400">
              বকেয়া জমা গ্রহণ করুন, ক্যাশ ব্যালেন্স আপডেট হবে এবং রসিদ মেসেজ তৈরি হবে
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">বাকি থাকা কাস্টমার:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
            {dueCustomers.length} জন
          </span>
        </div>
      </div>

      {/* Main Split: Left Form (5 cols) + Right List (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Collection Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center justify-between">
            <span>বকেয়া জমা ফরম</span>
            <span className="text-xs text-emerald-400 font-mono">
              {voucherNo || 'Auto Voucher'}
            </span>
          </h3>

          <form onSubmit={handleSubmitCollection} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                কাস্টমার নির্বাচন করুন *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- কাস্টমার নির্বাচন করুন --</option>
                {customers.map((c) => {
                  const due = getCustomerDue(c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || 'ফোন নেই'}) — বকেয়া {formatMoney(due, settings.currencySymbol)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Customer Due Badge */}
            {selectedCustomer && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">কাস্টমারের নাম:</span>
                  <span className="font-semibold text-white">{selectedCustomer.name}</span>
                </div>
                {selectedCustomer.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">মোবাইল:</span>
                    <span className="font-mono text-slate-300">{selectedCustomer.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-300 font-medium">বর্তমান অবশিষ্ট বকেয়া:</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {formatMoney(currentDue, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                জমা গ্রহণের পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                placeholder="0.00"
                value={collectionAmount}
                onChange={(e) => setCollectionAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-emerald-400 font-bold text-base focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">পেমেন্ট মেথড</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                >
                  <option value="Cash">নগদ (Cash)</option>
                  <option value="bKash">বিকাশ (bKash)</option>
                  <option value="Nagad">নগদ (Nagad)</option>
                  <option value="Bank">ব্যাংক অ্যাকাউন্ট</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">জমার তারিখ</label>
                <input
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                ভাউচার / রসিদ নং (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="ফাঁকা রাখলে স্বয়ংক্রিয় তৈরি হবে"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">মন্তব্য (নোট)</label>
              <input
                type="text"
                placeholder="যেমন: ড্রাইভারের মাধ্যমে পাঠানো হয়েছে"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedCustomerId}
              className="w-full py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              কালেকশন সংরক্ষণ করুন
            </button>
          </form>

          {/* Last Receipt Notification & WhatsApp share */}
          {lastReceipt && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>কালেকশন সফলভাবে জমা হয়েছে!</span>
              </div>
              <p className="text-slate-300">
                গ্রাহক <strong>{lastReceipt.customerName}</strong> এর কাছ থেকে{' '}
                <span className="font-mono text-emerald-400 font-bold">
                  {formatMoney(lastReceipt.amount, settings.currencySymbol)}
                </span>{' '}
                জমা নেওয়া হয়েছে। বর্তমান অবশিষ্ট বকেয়া:{' '}
                <span className="font-mono text-rose-300 font-bold">
                  {formatMoney(lastReceipt.remainingDue, settings.currencySymbol)}
                </span>
              </p>

              <button
                onClick={handleCopySms}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'কাস্টমার মেসেজ কপি হয়েছে!' : 'SMS / হোয়াটসঅ্যাপ মেসেজ কপি করুন'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Debtor Customers List + Collections History (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Pay Debtor Customers */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-white text-sm pb-3 border-b border-slate-800 mb-3 flex items-center justify-between">
              <span>শীর্ষ পাওনাদার খদ্দের তালিকা</span>
              <span className="text-xs text-rose-400 font-mono">
                মোট বাকি: {formatMoney(dueCustomers.reduce((s, c) => s + c.due, 0), settings.currencySymbol)}
              </span>
            </h3>

            {dueCustomers.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                আলহামদুলিল্লাহ! কোনো কাস্টমারের কাছে বকেয়া পাওনা নেই।
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                {dueCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedCustomerId === c.id
                        ? 'bg-emerald-500/10 border-emerald-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-semibold text-white text-xs truncate">
                        {c.name}
                      </div>
                      <span className="font-mono font-bold text-xs text-rose-400">
                        {formatMoney(c.due, settings.currencySymbol)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>{c.phone || 'ফোন নেই'}</span>
                      <span className="text-[10px] text-emerald-400 font-medium">আদায় নির্বাচন →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Collections Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-white text-sm pb-3 border-b border-slate-800 mb-3 flex items-center justify-between">
              <span>সাম্প্রতিক আদায় হিস্টোরি</span>
              <span className="text-xs text-slate-400 font-mono">
                মোট আদায়: {collections.length} টি
              </span>
            </h3>

            {collections.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                এখনো কোনো কালেকশন রেকর্ড হয়নি।
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[10px] uppercase">
                      <th className="pb-2">ভাউচার</th>
                      <th className="pb-2">তারিখ</th>
                      <th className="pb-2">কাস্টমার</th>
                      <th className="pb-2 text-right">আদায়কৃত টাকা</th>
                      <th className="pb-2 text-center">মেথড</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {[...collections]
                      .sort(
                        (a, b) =>
                          new Date(b.collectionDate).getTime() -
                          new Date(a.collectionDate).getTime()
                      )
                      .map((col) => (
                        <tr key={col.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 font-mono text-slate-300">
                            {col.voucherNo || `COL-#${col.id}`}
                          </td>
                          <td className="py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {formatDateTime(col.collectionDate)}
                          </td>
                          <td className="py-2.5 font-medium text-white max-w-[140px] truncate">
                            {col.customerName || 'গ্রাহক'}
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {formatMoney(col.amount, settings.currencySymbol)}
                          </td>
                          <td className="py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                              {col.method}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
