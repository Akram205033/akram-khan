import React, { useState, useMemo } from 'react';
import { CashTransaction, ShopSettings } from '../types/pos';
import { formatMoney, formatDateTime } from '../utils/formatters';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  History,
  Filter,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface CashRegisterViewProps {
  cashTransactions: CashTransaction[];
  settings: ShopSettings;
  cashBalance: number;
  onAddManualCashTx: (
    type: 'IN' | 'OUT',
    source: 'Manual_IN' | 'Manual_OUT',
    amount: number,
    note: string
  ) => void;
}

export const CashRegisterView: React.FC<CashRegisterViewProps> = ({
  cashTransactions,
  settings,
  cashBalance,
  onAddManualCashTx,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [manualType, setManualType] = useState<'IN' | 'OUT'>('IN');
  const [manualAmount, setManualAmount] = useState('');
  const [manualNote, setManualNote] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(manualAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('সঠিক টাকার অঙ্ক লিখুন।');
      return;
    }
    if (!manualNote.trim()) {
      alert('কারণ বা বিবরণ লিখুন।');
      return;
    }

    onAddManualCashTx(
      manualType,
      manualType === 'IN' ? 'Manual_IN' : 'Manual_OUT',
      amt,
      manualNote.trim()
    );

    setManualAmount('');
    setManualNote('');
    alert(
      manualType === 'IN'
        ? `ক্যাশে ৳${amt} সফলভাবে জমা হয়েছে!`
        : `ক্যাশ থেকে ৳${amt} উত্তোলন রেকর্ড হয়েছে!`
    );
  };

  const totalIn = useMemo(() => {
    return cashTransactions
      .filter((t) => t.txType === 'IN')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const totalOut = useMemo(() => {
    return cashTransactions
      .filter((t) => t.txType === 'OUT')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const filteredTx = useMemo(() => {
    return cashTransactions.filter(
      (t) => filterType === 'ALL' || t.txType === filterType
    );
  }, [cashTransactions, filterType]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Wallet className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              ক্যাশ রেজিস্টার ও দৈনিক খতিয়ান
            </h2>
            <p className="text-xs text-slate-400">
              নগদ টাকা গ্রহণ ও খরচের পরিপূর্ণ হিসাব এবং ভাউচার হিস্টোরি
            </p>
          </div>
        </div>

        {/* Live Cash In Hand Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-700">
          <span className="text-xs text-slate-400">বর্তমান ক্যাশ ব্যালেন্স:</span>
          <span className="font-mono font-bold text-cyan-400 text-lg">
            {formatMoney(cashBalance, settings.currencySymbol)}
          </span>
        </div>
      </div>

      {/* 3 Metric Cards: Total IN, Total OUT, Net Cash */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">মোট ক্যাশ জমা (Cash IN)</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              +{formatMoney(totalIn, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">বিক্রি ও কালেকশন বাবদ</div>
          </div>
          <span className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ArrowUpRight className="w-6 h-6" />
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">মোট ক্যাশ খরচ (Cash OUT)</div>
            <div className="text-xl font-bold font-mono text-rose-400">
              -{formatMoney(totalOut, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">মালামাল ক্রয় ও দোকান খরচ</div>
          </div>
          <span className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <ArrowDownRight className="w-6 h-6" />
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">বর্তমান নগদ স্থিতি</div>
            <div className="text-xl font-bold font-mono text-cyan-400">
              {formatMoney(cashBalance, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">ড্রয়ারে থাকা ক্যাশ টাকা</div>
          </div>
          <span className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Wallet className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Main Split: Manual Adjustment Form (4 cols) + Transaction Ledger (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Manual Cash In/Out Form */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            ম্যানুয়াল ক্যাশ এডজাস্টমেন্ট
          </h3>

          <form onSubmit={handleManualSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">লেনদেনের ধরন</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setManualType('IN')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    manualType === 'IN'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  ক্যাশ জমা (IN)
                </button>
                <button
                  type="button"
                  onClick={() => setManualType('OUT')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    manualType === 'OUT'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  ক্যাশ উত্তোলন (OUT)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                টাকার পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                placeholder="0.00"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white text-base font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                কারণ / বিবরণ *
              </label>
              <textarea
                rows={2}
                required
                placeholder="যেমন: মালিকের ব্যক্তিগত প্রয়োজনে উত্তোলন / ক্যাশে মূলধন বৃদ্ধি"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl font-bold transition-all shadow-md ${
                manualType === 'IN'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
              }`}
            >
              {manualType === 'IN' ? 'ক্যাশে টাকা জমা দিন' : 'ক্যাশ থেকে টাকা উত্তোলন করুন'}
            </button>
          </form>
        </div>

        {/* Right: Transactions Table (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              ক্যাশ লেনদেনের ইতিহাস
            </h3>

            {/* Filter buttons */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded-lg font-medium ${
                  filterType === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
              >
                সকল
              </button>
              <button
                onClick={() => setFilterType('IN')}
                className={`px-3 py-1 rounded-lg font-medium ${
                  filterType === 'IN' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'
                }`}
              >
                আয় / জমা (IN)
              </button>
              <button
                onClick={() => setFilterType('OUT')}
                className={`px-3 py-1 rounded-lg font-medium ${
                  filterType === 'OUT' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400'
                }`}
              >
                ব্যয় / উত্তোলন (OUT)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold text-[10px] uppercase">
                  <th className="py-2.5 px-3">তারিখ ও সময়</th>
                  <th className="py-2.5 px-2 text-center">টাইপ</th>
                  <th className="py-2.5 px-3">উৎস (Source)</th>
                  <th className="py-2.5 px-3">রেফারেন্স নং</th>
                  <th className="py-2.5 px-3">নোট / বিবরণ</th>
                  <th className="py-2.5 px-3 text-right">টাকার পরিমাণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      কোনো ক্যাশ লেনদেন পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  [...filteredTx]
                    .sort(
                      (a, b) =>
                        new Date(b.txDate).getTime() - new Date(a.txDate).getTime()
                    )
                    .map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {formatDateTime(tx.txDate)}
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.txType === 'IN'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {tx.txType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 font-medium whitespace-nowrap">
                          {tx.source === 'Sale'
                            ? 'বিক্রয় (Sale)'
                            : tx.source === 'Collection'
                            ? 'বাকি আদায়'
                            : tx.source === 'Purchase'
                            ? 'মালামাল ক্রয়'
                            : tx.source === 'Expense'
                            ? 'দোকান খরচ'
                            : tx.source === 'Manual_IN'
                            ? 'ম্যানুয়াল জমা'
                            : tx.source === 'Manual_OUT'
                            ? 'মালিক উত্তোলন'
                            : 'ওপেনিং ব্যালেন্স'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                          {tx.reference || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 max-w-[180px] truncate">
                          {tx.note || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          <span
                            className={tx.txType === 'IN' ? 'text-emerald-400' : 'text-rose-400'}
                          >
                            {tx.txType === 'IN' ? '+' : '-'}
                            {formatMoney(tx.amount, settings.currencySymbol)}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
