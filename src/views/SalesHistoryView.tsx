import React, { useState, useMemo } from 'react';
import { Sale, SaleReturn, SaleReturnItem, Product, ShopSettings } from '../types/pos';
import { formatMoney, formatDateTime, generateInvoiceNumber } from '../utils/formatters';
import {
  History,
  RotateCcw,
  Search,
  Eye,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  FileText,
  Printer,
  Undo2,
} from 'lucide-react';

interface SalesHistoryViewProps {
  sales: Sale[];
  returns: SaleReturn[];
  products: Product[];
  settings: ShopSettings;
  returnsCount: number;
  onViewInvoice: (sale: Sale) => void;
  onProcessReturn: (
    newReturn: SaleReturn,
    updatedProducts: Product[],
    updatedSale?: Sale
  ) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  sales,
  returns,
  products,
  settings,
  returnsCount,
  onViewInvoice,
  onProcessReturn,
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'returns'>('sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Return Modal State
  const [returnTargetSale, setReturnTargetSale] = useState<Sale | null>(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState<{
    [productId: number]: { qty: number; returnPrice: number };
  }>({});
  const [refundMethod, setRefundMethod] = useState<'Cash' | 'Credit_Adjustment' | 'bKash'>('Cash');
  const [returnReason, setReturnReason] = useState('ভুল সাইজ / পরিমাপে অমিল');

  // Filtered sales
  const filteredSales = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    const d7Str = d7.toISOString().split('T')[0];
    const monthStr = new Date().toISOString().slice(0, 7);

    return sales.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.invoiceNo.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.customerPhone && s.customerPhone.includes(q));

      if (!matchesSearch) return false;

      if (dateFilter === 'today') return s.saleDate.startsWith(todayStr);
      if (dateFilter === 'week') return s.saleDate.split('T')[0] >= d7Str;
      if (dateFilter === 'month') return s.saleDate.startsWith(monthStr);

      return true;
    });
  }, [sales, searchQuery, dateFilter]);

  // Open return modal
  const openReturnModal = (sale: Sale) => {
    setReturnTargetSale(sale);
    // Initialize return quantities
    const initial: { [id: number]: { qty: number; returnPrice: number } } = {};
    sale.items.forEach((it) => {
      initial[it.productId] = { qty: 0, returnPrice: it.unitPrice };
    });
    setSelectedReturnItems(initial);
    setReturnReason('ভুল সাইজ / পরিমাপে অমিল');
  };

  const calculateTotalRefund = useMemo(() => {
    if (!returnTargetSale) return 0;
    let sum = 0;
    returnTargetSale.items.forEach((it) => {
      const entry = selectedReturnItems[it.productId];
      if (entry && entry.qty > 0) {
        sum += entry.qty * entry.returnPrice;
      }
    });
    return sum;
  }, [returnTargetSale, selectedReturnItems]);

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTargetSale) return;

    if (calculateTotalRefund <= 0) {
      alert('ফেরত নেওয়ার জন্য অন্তত একটি পণ্যের পরিমাণ নির্ধারণ করুন।');
      return;
    }

    const returnItems: SaleReturnItem[] = [];
    returnTargetSale.items.forEach((it) => {
      const entry = selectedReturnItems[it.productId];
      if (entry && entry.qty > 0) {
        returnItems.push({
          productId: it.productId,
          productName: it.productName,
          qty: entry.qty,
          unit: it.unit,
          unitPrice: entry.returnPrice,
          refundAmount: entry.qty * entry.returnPrice,
        });
      }
    });

    const returnNo = generateInvoiceNumber('DM-RET', returnsCount);
    const newReturn: SaleReturn = {
      id: Date.now(),
      returnNo,
      saleId: returnTargetSale.id,
      invoiceNo: returnTargetSale.invoiceNo,
      customerId: returnTargetSale.customerId,
      customerName: returnTargetSale.customerName,
      returnDate: new Date().toISOString(),
      items: returnItems,
      totalRefund: calculateTotalRefund,
      refundMethod,
      reason: returnReason,
    };

    // Restore stock to products
    const updatedProducts = products.map((p) => {
      const returnedItem = returnItems.find((r) => r.productId === p.id);
      if (returnedItem) {
        return {
          ...p,
          stock: p.stock + returnedItem.qty,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    // Mark sale as having returns
    const updatedSale: Sale = {
      ...returnTargetSale,
      hasReturns: true,
    };

    onProcessReturn(newReturn, updatedProducts, updatedSale);
    alert(`পণ্য ফেরত সফল হয়েছে! রিটার্ন ভাউচার: ${returnNo} (ফেরত: ${formatMoney(calculateTotalRefund, settings.currencySymbol)})`);
    setReturnTargetSale(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <History className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              সেলস হিস্ট্রি ও বিক্রিত পণ্য ফেরত (Returns)
            </h2>
            <p className="text-xs text-slate-400">
              পূর্ববর্তী বিক্রয় রসিদ দেখুন, পুনঃমুদ্রণ করুন এবং পণ্য রিটার্ন গ্রহণ করুন
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'sales'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            বিক্রয় তালিকা ({sales.length})
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'returns'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ফেরত হিস্টোরি ({returns.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Sales History */}
      {activeTab === 'sales' && (
        <div className="space-y-3">
          {/* Filters Bar */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ইনভয়েস নং, গ্রাহকের নাম বা মোবাইল..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-2.5 py-1 rounded-lg ${
                  dateFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
              >
                সব
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-2.5 py-1 rounded-lg ${
                  dateFilter === 'today' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
              >
                আজকে
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-2.5 py-1 rounded-lg ${
                  dateFilter === 'week' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
              >
                গত ৭ দিন
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-2.5 py-1 rounded-lg ${
                  dateFilter === 'month' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
              >
                চলতি মাস
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-4">ইনভয়েস নং</th>
                    <th className="py-3 px-3">তারিখ ও সময়</th>
                    <th className="py-3 px-3">গ্রাহকের নাম</th>
                    <th className="py-3 px-3 text-center">আইটেম সংখ্যা</th>
                    <th className="py-3 px-3 text-right">মোট বিল</th>
                    <th className="py-3 px-3 text-right">আদায়</th>
                    <th className="py-3 px-3 text-right">বকেয়া</th>
                    <th className="py-3 px-3 text-center">মাধ্যম</th>
                    <th className="py-3 px-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                        কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-medium text-slate-200">
                          {s.invoiceNo}
                          {s.hasReturns && (
                            <span className="block text-[9px] text-amber-400">
                              (রিটার্ন যুক্ত)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {formatDateTime(s.saleDate)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">
                            {s.customerName || 'সাধারণ খদ্দের'}
                          </div>
                          {s.customerPhone && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {s.customerPhone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">
                          {s.items?.length || 0} টি
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                          {formatMoney(s.total, settings.currencySymbol)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 whitespace-nowrap">
                          {formatMoney(s.paid, settings.currencySymbol)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                          {s.due > 0 ? (
                            <span className="text-rose-400">
                              {formatMoney(s.due, settings.currencySymbol)}
                            </span>
                          ) : (
                            <span className="text-slate-500">০.০০</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            {s.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onViewInvoice(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                              title="ইনভয়েস দেখুন ও প্রিন্ট করুন"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => openReturnModal(s)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1"
                              title="মাল ফেরত গ্রহণ করুন"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              <span>ফেরত</span>
                            </button>
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

      {/* Tab 2: Returns History */}
      {activeTab === 'returns' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>মোট ফেরত রেকর্ড: {returns.length} টি</span>
            <span className="font-mono text-rose-400 font-bold">
              সর্বমোট রিফান্ড ফেরত: {formatMoney(returns.reduce((sum, r) => sum + r.totalRefund, 0), settings.currencySymbol)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">রিটার্ন ভাউচার নং</th>
                  <th className="py-3 px-3">তারিখ</th>
                  <th className="py-3 px-3">মূল ইনভয়েস নং</th>
                  <th className="py-3 px-3">গ্রাহক</th>
                  <th className="py-3 px-3">ফেরত নেওয়া পণ্যসমূহ</th>
                  <th className="py-3 px-3 text-right">ফেরতকৃত টাকা</th>
                  <th className="py-3 px-3">ফেরতের মাধ্যম</th>
                  <th className="py-3 px-4">কারণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                      এখনো কোনো পণ্য ফেরত রেকর্ড করা হয়নি।
                    </td>
                  </tr>
                ) : (
                  returns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-rose-400">
                        {r.returnNo}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {formatDateTime(r.returnDate)}
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-400">
                        {r.invoiceNo}
                      </td>
                      <td className="py-3 px-3 text-white font-medium">
                        {r.customerName || 'সাধারণ খদ্দের'}
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-[200px] truncate">
                        {r.items.map((it) => `${it.productName} (${it.qty} ${it.unit})`).join(', ')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                        {formatMoney(r.totalRefund, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {r.refundMethod === 'Cash'
                          ? 'নগদ ফেরত'
                          : r.refundMethod === 'Credit_Adjustment'
                          ? 'বকেয়া কর্তন'
                          : 'বিকাশ'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] max-w-[150px] truncate">
                        {r.reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnTargetSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="font-bold text-white text-base">বিক্রিত পণ্য ফেরত গ্রহণ</h3>
                  <div className="text-xs text-slate-400">
                    ইনভয়েস: {returnTargetSale.invoiceNo} · গ্রাহক: {returnTargetSale.customerName || 'সাধারণ খদ্দের'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setReturnTargetSale(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                পণ্য ফেরত নিলে স্বয়ংক্রিয়ভাবে ইনভেন্টরিতে স্টক যুক্ত হবে এবং ক্যাশ/বকেয়া সমন্বয় হবে।
              </div>

              {/* Items in invoice */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 text-[10px] uppercase font-semibold">
                      <th className="p-2.5">পণ্য</th>
                      <th className="p-2.5 text-center">বিক্রিত পরিমাণ</th>
                      <th className="p-2.5 text-right">বিক্রয়মূল্য</th>
                      <th className="p-2.5 text-center">ফেরত পরিমাণ</th>
                      <th className="p-2.5 text-right">ফেরত মূল্য</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {returnTargetSale.items.map((it) => {
                      const entry = selectedReturnItems[it.productId] || {
                        qty: 0,
                        returnPrice: it.unitPrice,
                      };
                      return (
                        <tr key={it.productId} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-medium text-white">{it.productName}</td>
                          <td className="p-2.5 text-center font-mono text-slate-400">
                            {it.qty} {it.unit}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-400">
                            {formatMoney(it.unitPrice, settings.currencySymbol)}
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max={it.qty}
                              value={entry.qty}
                              onChange={(e) => {
                                const val = Math.min(it.qty, Math.max(0, parseInt(e.target.value) || 0));
                                setSelectedReturnItems((prev) => ({
                                  ...prev,
                                  [it.productId]: { ...prev[it.productId], qty: val },
                                }));
                              }}
                              className="w-16 px-2 py-1 text-center font-mono rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-rose-400">
                            {formatMoney(entry.qty * entry.returnPrice, settings.currencySymbol)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total Refund Banner */}
              <div className="flex justify-between items-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                <span className="font-bold text-slate-200">মোট রিফান্ড / ফেরতযোগ্য টাকা:</span>
                <span className="font-mono font-bold text-rose-400 text-base">
                  {formatMoney(calculateTotalRefund, settings.currencySymbol)}
                </span>
              </div>

              {/* Refund Method & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    ফেরতের মাধ্যম *
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Cash">নগদ টাকা ফেরত (Cash Refund)</option>
                    <option value="Credit_Adjustment">কাস্টমারের বকেয়া থেকে বাদ (Credit Adjustment)</option>
                    <option value="bKash">বিকাশ / নগদ ট্রান্সফার</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    ফেরতের কারণ *
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="ভুল সাইজ / পরিমাপে অমিল">ভুল সাইজ / পরিমাপে অমিল</option>
                    <option value="ত্রুটিপূর্ণ পার্টস / ডিফেক্টিভ">ত্রুটিপূর্ণ পার্টস / ডিফেক্টিভ</option>
                    <option value="অতিরিক্ত কেনা হয়েছিল">অতিরিক্ত কেনা হয়েছিল</option>
                    <option value="গাড়ির মেকানিক বাতিল করেছে">গাড়ির মেকানিক বাতিল করেছে</option>
                    <option value="অন্যান্য">অন্যান্য কারণ</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReturnTargetSale(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={calculateTotalRefund <= 0}
                  className="px-5 py-2 rounded-xl font-bold bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-500/20 disabled:opacity-50"
                >
                  পণ্য ফেরত নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
