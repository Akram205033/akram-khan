import React from 'react';
import {
  Product,
  Sale,
  Expense,
  Customer,
  Supplier,
  CashTransaction,
  ShopSettings,
} from '../types/pos';
import { formatMoney, formatDateTime } from '../utils/formatters';
import {
  TrendingUp,
  CreditCard,
  Receipt,
  Boxes,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  PlusCircle,
  Eye,
  HandCoins,
  DollarSign,
  PackageCheck,
} from 'lucide-react';
import {
  DailySalesTrendsChart,
  MonthlyExpenseBreakdownChart,
} from '../components/DashboardCharts';

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  suppliers: Supplier[];
  cashTransactions: CashTransaction[];
  settings: ShopSettings;
  cashBalance: number;
  totalMarketDue: number;
  totalSupplierDue: number;
  onNavigate: (page: any) => void;
  onViewInvoice: (sale: Sale) => void;
  onQuickAddProduct: () => void;
  onQuickExpense: () => void;
  onQuickCollection: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  sales,
  expenses,
  settings,
  cashBalance,
  totalMarketDue,
  totalSupplierDue,
  onNavigate,
  onViewInvoice,
  onQuickAddProduct,
  onQuickExpense,
  onQuickCollection,
}) => {
  const todayIso = new Date().toISOString().split('T')[0];

  const todaySalesList = sales.filter((s) => s.saleDate.startsWith(todayIso));
  const todaySalesTotal = todaySalesList.reduce((sum, s) => sum + s.total, 0);
  const todayPaid = todaySalesList.reduce((sum, s) => sum + s.paid, 0);
  const todayDueCreated = todaySalesList.reduce((sum, s) => sum + s.due, 0);

  const todayExpensesList = expenses.filter((e) => e.expenseDate.startsWith(todayIso));
  const todayExpenseTotal = todayExpensesList.reduce((sum, e) => sum + e.amount, 0);

  const totalStockCount = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const stockCostValue = products.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0);
  const stockSellingValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);
  const potentialProfit = Math.max(0, stockSellingValue - stockCostValue);

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome banner & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              ব্যবসায়িক ড্যাশবোর্ড
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              আজকের আপডেট
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {settings.shopNameBn} — পার্টস বিক্রি, স্টক, ক্যাশ ও বাকির সার্বিক অবস্থা।
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>নতুন বিক্রি</span>
          </button>

          <button
            onClick={onQuickCollection}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all"
          >
            <HandCoins className="w-4 h-4" />
            <span>বাকি আদায়</span>
          </button>

          <button
            onClick={onQuickAddProduct}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>পণ্য যোগ</span>
          </button>

          <button
            onClick={onQuickExpense}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <Receipt className="w-4 h-4 text-rose-400" />
            <span>খরচ এন্ট্রি</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Today's Sales */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">আজকের মোট বিক্রয়</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatMoney(todaySalesTotal, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>ইনভয়েস: {todaySalesList.length} টি</span>
            {todayDueCreated > 0 && (
              <span className="text-amber-400 font-medium">
                বাকি: {formatMoney(todayDueCreated, settings.currencySymbol)}
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Today's Cash Collection */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">আজ বিক্রয়ে আদায়</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {formatMoney(todayPaid, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            নগদ ও ডিজিটাল আদায়
          </div>
        </div>

        {/* Card 3: Today's Expense */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">আজকের মোট খরচ</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">
            {formatMoney(todayExpenseTotal, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            খরচ এন্ট্রি: {todayExpensesList.length} টি
          </div>
        </div>

        {/* Card 4: Cash in Hand */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">ক্যাশ ইন হ্যান্ড</span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {formatMoney(cashBalance, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            বর্তমান নগদ তহবিল
          </div>
        </div>

        {/* Card 5: Total Customer Due */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">মার্কেট কাস্টমার বাকি</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {formatMoney(totalMarketDue, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>পাওনাদার কাস্টমার</span>
            <button
              onClick={() => onNavigate('collection')}
              className="text-amber-400 hover:underline text-[10px] font-medium"
            >
              আদায় করুন
            </button>
          </div>
        </div>

        {/* Card 6: Total Products */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">মোট পণ্য ও স্টক</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {totalStockCount} <span className="text-xs font-normal text-slate-400">আইটেম</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            মোট মজুত: {totalStockUnits.toLocaleString()} ইউনিট
          </div>
        </div>
      </div>

      {/* Stock Value & Financial Highlights Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-800 text-amber-400">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">স্টকের ক্রয়মূল্য (ইনভেন্টরি ভ্যালু)</div>
            <div className="text-lg font-bold font-mono text-slate-200">
              {formatMoney(stockCostValue, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-500">বিক্রয়মূল্য: {formatMoney(stockSellingValue, settings.currencySymbol)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">সম্ভাব্য মোট মোট লাভ (Stock Margin)</div>
            <div className="text-lg font-bold font-mono text-emerald-400">
              +{formatMoney(potentialProfit, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-500">
              গড় মার্জিন: {stockCostValue > 0 ? ((potentialProfit / stockCostValue) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-800 text-rose-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">মহাজন বাকি (Supplier Payable)</div>
            <div className="text-lg font-bold font-mono text-rose-400">
              {formatMoney(totalSupplierDue, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-500">
              সাপ্লায়ার দেনা
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics with Recharts: Daily Sales Trends & Monthly Expense Breakdowns */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DailySalesTrendsChart sales={sales} settings={settings} />
        <MonthlyExpenseBreakdownChart expenses={expenses} settings={settings} />
      </div>

      {/* Two columns: Low Stock Alerts + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Low Stock Alert (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">লো স্টক সতর্কতা</h3>
                {lowStockProducts.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {lowStockProducts.length} টি
                  </span>
                )}
              </div>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                সব পণ্য দেখুন →
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto mb-2 flex items-center justify-center font-bold">
                  ✓
                </div>
                সকল পণ্যের পর্যাপ্ত স্টক রয়েছে। কোনো ঘাটতি নেই!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-rose-500/20 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-white truncate">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-500">{p.sku}</span>
                        <span>·</span>
                        <span className="text-rose-400 font-medium">
                          বর্তমান স্টক: {p.stock} {p.unit}
                        </span>
                        <span>·</span>
                        <span className="text-slate-500">ন্যূনতম: {p.minStock} {p.unit}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('purchases')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap"
                    >
                      ক্রয় করুন
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
            ন্যূনতম স্টক সতর্কতা অনুযায়ী আগে থেকেই অর্ডার করুন।
          </div>
        </div>

        {/* Right: Recent Sales (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">সাম্প্রতিক বিক্রয় তালিকা</h3>
              </div>
              <button
                onClick={() => onNavigate('pos')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                কাউন্টারে যান →
              </button>
            </div>

            {recentSales.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                এখনো কোনো বিক্রয় রেকর্ড হয়নি। কাউন্টার থেকে প্রথম বিক্রি করুন!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="pb-2">ইনভয়েস</th>
                      <th className="pb-2">গ্রাহক</th>
                      <th className="pb-2 text-right">মোট বিল</th>
                      <th className="pb-2 text-right">জমা</th>
                      <th className="pb-2 text-right">বাকি</th>
                      <th className="pb-2 text-center">মেমো</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 font-mono text-slate-300">
                          {sale.invoiceNo}
                        </td>
                        <td className="py-2.5">
                          <div className="font-medium text-white truncate max-w-[140px]">
                            {sale.customerName || 'সাধারণ খদ্দের'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {formatDateTime(sale.saleDate)}
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold text-white">
                          {formatMoney(sale.total, settings.currencySymbol)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-emerald-400 font-medium">
                          {formatMoney(sale.paid, settings.currencySymbol)}
                        </td>
                        <td className="py-2.5 text-right font-mono font-medium">
                          {sale.due > 0 ? (
                            <span className="text-rose-400">
                              {formatMoney(sale.due, settings.currencySymbol)}
                            </span>
                          ) : (
                            <span className="text-slate-500">০.০০</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => onViewInvoice(sale)}
                            className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="ইনভয়েস দেখুন ও প্রিন্ট করুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>সর্বমোট বিক্রয় ইনভয়েস: {sales.length} টি</span>
            <span className="font-mono text-emerald-400 font-semibold">
              মোট ক্যাশ আদায়: {formatMoney(sales.reduce((sum, s) => sum + s.paid, 0), settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
