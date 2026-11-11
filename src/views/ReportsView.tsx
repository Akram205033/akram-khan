import React, { useState, useMemo } from 'react';
import { Sale, Expense, Product, Customer, ShopSettings } from '../types/pos';
import { formatMoney, formatDateOnly } from '../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Printer,
  Calendar,
  CheckCircle,
  Package,
  Award,
  Users,
  Percent,
} from 'lucide-react';

interface ReportsViewProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  customers: Customer[];
  settings: ShopSettings;
  getCustomerDue: (customerId: number) => number;
}

type TimeRange = 'today' | 'last7' | 'thisMonth' | 'all';

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  expenses,
  products,
  customers,
  settings,
  getCustomerDue,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');

  // Filter sales & expenses by selected time range
  const { filteredSales, filteredExpenses } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    const d7Str = d7.toISOString().split('T')[0];

    const monthStr = now.toISOString().slice(0, 7); // e.g. "2026-11"

    let fSales = sales;
    let fExpenses = expenses;

    if (timeRange === 'today') {
      fSales = sales.filter((s) => s.saleDate.startsWith(todayStr));
      fExpenses = expenses.filter((e) => e.expenseDate.startsWith(todayStr));
    } else if (timeRange === 'last7') {
      fSales = sales.filter((s) => s.saleDate.split('T')[0] >= d7Str);
      fExpenses = expenses.filter((e) => e.expenseDate.split('T')[0] >= d7Str);
    } else if (timeRange === 'thisMonth') {
      fSales = sales.filter((s) => s.saleDate.startsWith(monthStr));
      fExpenses = expenses.filter((e) => e.expenseDate.startsWith(monthStr));
    }

    return { filteredSales: fSales, filteredExpenses: fExpenses };
  }, [sales, expenses, timeRange]);

  // Financial calculations
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.total, 0);
  }, [filteredSales]);

  const totalDiscount = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.discount, 0);
  }, [filteredSales]);

  // Cost of goods sold (COGS)
  const totalCogs = useMemo(() => {
    return filteredSales.reduce((sum, s) => {
      const itemsCost = s.items.reduce(
        (sub, it) => sub + (it.costPrice || 0) * it.qty,
        0
      );
      return sum + itemsCost;
    }, 0);
  }, [filteredSales]);

  const grossProfit = totalRevenue - totalCogs;
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const grossMarginPercent =
    totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';
  const netMarginPercent =
    totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Top Selling Products
  const topProducts = useMemo(() => {
    const map: {
      [id: number]: {
        name: string;
        qty: number;
        revenue: number;
        profit: number;
        unit: string;
      };
    } = {};

    filteredSales.forEach((s) => {
      s.items.forEach((it) => {
        if (!map[it.productId]) {
          map[it.productId] = {
            name: it.productName,
            qty: 0,
            revenue: 0,
            profit: 0,
            unit: it.unit,
          };
        }
        const profit = it.lineTotal - (it.costPrice || 0) * it.qty;
        map[it.productId].qty += it.qty;
        map[it.productId].revenue += it.lineTotal;
        map[it.productId].profit += profit;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [filteredSales]);

  // Top Debtor Customers
  const topDebtors = useMemo(() => {
    return customers
      .map((c) => ({
        ...c,
        due: getCustomerDue(c.id),
      }))
      .filter((c) => c.due > 0)
      .sort((a, b) => b.due - a.due)
      .slice(0, 5);
  }, [customers, getCustomerDue]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              ব্যবসায়িক রিপোর্ট ও লাভ-ক্ষতি (P&amp;L)
            </h2>
            <p className="text-xs text-slate-400">
              বিক্রয়, বিক্রিত মালের খরচ, অপারেটিং ব্যয় ও চূড়ান্ত নিট লাভ
            </p>
          </div>
        </div>

        {/* Time range selector & print */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                timeRange === 'today'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              আজকে
            </button>
            <button
              onClick={() => setTimeRange('last7')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                timeRange === 'last7'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              গত ৭ দিন
            </button>
            <button
              onClick={() => setTimeRange('thisMonth')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                timeRange === 'thisMonth'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              চলতি মাস
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                timeRange === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              সর্বকালের
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="no-print p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
            title="রিপোর্ট প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Income Statement Card (P&L Breakdown) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center justify-between">
          <span>লাভ-ক্ষতি বিবরণী (Income Statement)</span>
          <span className="text-xs text-amber-400 font-medium">
            {timeRange === 'today'
              ? 'আজকের হিসাব'
              : timeRange === 'last7'
              ? 'বিগত ৭ দিনের হিসাব'
              : timeRange === 'thisMonth'
              ? 'চলতি মাসের হিসাব'
              : 'সামগ্রিক হিসাব'}
          </span>
        </h3>

        {/* 4 Large Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">মোট বিক্রয় (Total Revenue)</span>
            <span className="font-mono font-bold text-xl text-white">
              {formatMoney(totalRevenue, settings.currencySymbol)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              মোট ইনভয়েস: {filteredSales.length} টি
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">
              মালের ক্রয়মূল্য (COGS)
            </span>
            <span className="font-mono font-bold text-xl text-slate-300">
              {formatMoney(totalCogs, settings.currencySymbol)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">বিক্রিত পার্টসের ক্রয় খরচ</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">
              মোট লাভ (Gross Profit)
            </span>
            <span className="font-mono font-bold text-xl text-amber-400">
              {formatMoney(grossProfit, settings.currencySymbol)}
            </span>
            <span className="text-[11px] text-amber-400/80 block mt-1">
              গ্রস মার্জিন: {grossMarginPercent}%
            </span>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              netProfit >= 0
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            <span className="text-xs text-slate-300 block mb-1">
              প্রকৃত নিট লাভ (Net Profit)
            </span>
            <span
              className={`font-mono font-bold text-xl ${
                netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {netProfit >= 0 ? '+' : ''}
              {formatMoney(netProfit, settings.currencySymbol)}
            </span>
            <span className="text-[11px] text-slate-300 block mt-1">
              নিট মার্জিন: {netMarginPercent}%
            </span>
          </div>
        </div>

        {/* Detailed Itemized P&L Table */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex justify-between py-1 text-slate-300">
            <span>(+) মোট পণ্য বিক্রয় (Gross Sales):</span>
            <span className="font-mono font-medium">
              {formatMoney(totalRevenue + totalDiscount, settings.currencySymbol)}
            </span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between py-1 text-rose-400">
              <span>(-) বিক্রয় ডিসকাউন্ট (Discount Given):</span>
              <span className="font-mono">
                -{formatMoney(totalDiscount, settings.currencySymbol)}
              </span>
            </div>
          )}

          <div className="flex justify-between py-1 text-slate-200 font-semibold border-t border-slate-800">
            <span>(=) নিট বিক্রয় আয় (Net Sales):</span>
            <span className="font-mono">{formatMoney(totalRevenue, settings.currencySymbol)}</span>
          </div>

          <div className="flex justify-between py-1 text-rose-400">
            <span>(-) বিক্রিত মালের ক্রয়মূল্য (Cost of Goods Sold):</span>
            <span className="font-mono">
              -{formatMoney(totalCogs, settings.currencySymbol)}
            </span>
          </div>

          <div className="flex justify-between py-1.5 text-amber-400 font-bold border-t border-slate-800 text-sm">
            <span>(=) গ্রস প্রফিট / মোট লাভ (Gross Profit):</span>
            <span className="font-mono">{formatMoney(grossProfit, settings.currencySymbol)}</span>
          </div>

          <div className="flex justify-between py-1 text-rose-400">
            <span>(-) মোট অপারেটিং খরচ (দোকান ভাড়া, বিল, স্টাফ বেতন):</span>
            <span className="font-mono">
              -{formatMoney(totalExpenses, settings.currencySymbol)}
            </span>
          </div>

          <div
            className={`flex justify-between py-2 font-bold border-t border-slate-700 text-base ${
              netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span>(=) ফাইনাল নিট প্রফিট (Net Business Profit):</span>
            <span className="font-mono">
              {formatMoney(netProfit, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Two columns: Top Selling Products + Top Due Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            সর্বোচ্চ বিক্রিত স্পেয়ার পার্টস
          </h3>

          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              এই সময়ে কোনো বিক্রয় হয়নি।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[10px] uppercase">
                    <th className="pb-2">পণ্যের নাম</th>
                    <th className="pb-2 text-center">বিক্রয় পরিমাণ</th>
                    <th className="pb-2 text-right">মোট বিক্রয়মূল্য</th>
                    <th className="pb-2 text-right">অর্জিত লাভ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 font-medium text-white max-w-[180px] truncate">
                        {p.name}
                      </td>
                      <td className="py-2.5 text-center font-mono text-slate-300">
                        {p.qty} {p.unit}
                      </td>
                      <td className="py-2.5 text-right font-mono font-semibold text-white">
                        {formatMoney(p.revenue, settings.currencySymbol)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                        +{formatMoney(p.profit, settings.currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Due Customers (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-400" />
            শীর্ষ বাকি থাকা খদ্দের
          </h3>

          {topDebtors.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              কোনো কাস্টমারের কাছে বাকি পাওনা নেই।
            </div>
          ) : (
            <div className="space-y-2">
              {topDebtors.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white text-xs truncate">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{c.phone || 'ফোন নেই'}</div>
                  </div>
                  <div className="font-mono font-bold text-rose-400 text-xs">
                    {formatMoney(c.due, settings.currencySymbol)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
