import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Sale, Expense, ExpenseCategory, ShopSettings } from '../types/pos';
import { formatMoney } from '../utils/formatters';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  CreditCard,
  Receipt,
  Layers,
  ArrowUpRight,
  DollarSign,
  Percent,
  Wallet,
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'দোকান ভাড়া': '#f59e0b', // Amber
  'বিদ্যুৎ ও ওয়াইফাই বিল': '#06b6d4', // Cyan
  'কর্মচারী বেতন': '#6366f1', // Indigo
  'পরিবহন ও যাতায়াত': '#10b981', // Emerald
  'চা-নাস্তা ও আপ্যায়ন': '#f97316', // Orange
  'মেরামত ও রক্ষণাবেক্ষণ': '#a855f7', // Purple
  'প্যাকিং ও স্টেশনারি': '#ec4899', // Pink
  'অন্যান্য খরচ': '#94a3b8', // Slate
};

const BENGALI_MONTHS: Record<string, string> = {
  '01': 'জানুয়ারি',
  '02': 'ফেব্রুয়ারি',
  '03': 'মার্চ',
  '04': 'এপ্রিল',
  '05': 'মে',
  '06': 'জুন',
  '07': 'জুলাই',
  '08': 'আগস্ট',
  '09': 'সেপ্টেম্বর',
  '10': 'অক্টোবর',
  '11': 'নভেম্বর',
  '12': 'ডিসেম্বর',
};

const BENGALI_DIGITS: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
};

const toBnDigits = (val: number | string): string => {
  return String(val).replace(/[0-9]/g, (d) => BENGALI_DIGITS[d] || d);
};

// ==========================================
// 1. DAILY SALES TRENDS COMPONENT
// ==========================================
interface DailySalesTrendsProps {
  sales: Sale[];
  settings: ShopSettings;
}

export const DailySalesTrendsChart: React.FC<DailySalesTrendsProps> = ({ sales, settings }) => {
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30'>('7');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Generate daily points for the selected range ending today
  const chartData = useMemo(() => {
    const daysCount = parseInt(timeRange, 10);
    const result = [];
    const today = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];

      // Day & month string in Bengali
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const monthLabel = BENGALI_MONTHS[monthNum] ? BENGALI_MONTHS[monthNum].slice(0, 4) : '';
      const displayLabel = `${toBnDigits(dayNum)} ${monthLabel}`;

      // Aggregate sales for this day
      const daySales = sales.filter((s) => s.saleDate.startsWith(isoDate));
      const totalSales = daySales.reduce((sum, s) => sum + s.total, 0);
      const cashPaid = daySales.reduce((sum, s) => sum + s.paid, 0);
      const dueCreated = daySales.reduce((sum, s) => sum + s.due, 0);
      const invoiceCount = daySales.length;

      result.push({
        isoDate,
        dateLabel: displayLabel,
        totalSales,
        cashPaid,
        dueCreated,
        invoiceCount,
      });
    }

    return result;
  }, [sales, timeRange]);

  // Summary Metrics for the range
  const rangeTotals = useMemo(() => {
    const total = chartData.reduce((sum, d) => sum + d.totalSales, 0);
    const paid = chartData.reduce((sum, d) => sum + d.cashPaid, 0);
    const due = chartData.reduce((sum, d) => sum + d.dueCreated, 0);
    const daysCount = chartData.length || 1;
    const dailyAvg = Math.round(total / daysCount);
    const collectionRate = total > 0 ? Math.round((paid / total) * 100) : 0;

    return { total, paid, due, dailyAvg, collectionRate };
  }, [chartData]);

  // Custom Tooltip
  const CustomSalesTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-slate-950/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md text-xs min-w-[200px]">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {toBnDigits(data.invoiceCount)} টি মেমো
            </span>
          </div>
          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                মোট বিক্রয়:
              </span>
              <span className="font-bold">
                {formatMoney(data.totalSales, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                নগদ আদায়:
              </span>
              <span className="font-bold">
                {formatMoney(data.cashPaid, settings.currencySymbol)}
              </span>
            </div>
            {data.dueCreated > 0 && (
              <div className="flex items-center justify-between text-rose-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                  বাকি বিক্রি:
                </span>
                <span className="font-bold">
                  {formatMoney(data.dueCreated, settings.currencySymbol)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header with Title & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              দৈনিক বিক্রয় ট্রেন্ড (Daily Sales Trends)
            </h3>
            <p className="text-xs text-slate-400">
              দিন অনুযায়ী মোট বিক্রয় ও নগদ আদায়ের তুলনা
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg transition-colors ${
                chartType === 'area'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="এরিয়া কার্ভ চার্ট"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-colors ${
                chartType === 'bar'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="বার চার্ট"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Time range buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['7', '14', '30'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  timeRange === r
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {toBnDigits(r)} দিন
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mini KPI Highlights Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">নির্বাচিত সময়ের মোট বিক্রি</span>
          <span className="text-base font-bold font-mono text-amber-400 mt-0.5 block">
            {formatMoney(rangeTotals.total, settings.currencySymbol)}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">নগদ ও ডিজিটাল আদায়</span>
          <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
            {formatMoney(rangeTotals.paid, settings.currencySymbol)}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">নতুন বাকি তৈরি</span>
          <span className="text-base font-bold font-mono text-rose-400 mt-0.5 block">
            {formatMoney(rangeTotals.due, settings.currencySymbol)}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">দৈনিক গড় বিক্রি (আদায় হার)</span>
          <span className="text-base font-bold font-mono text-white mt-0.5 block">
            {formatMoney(rangeTotals.dailyAvg, settings.currencySymbol)}{' '}
            <span className="text-xs text-emerald-400 font-normal">({rangeTotals.collectionRate}%)</span>
          </span>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="dueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
              <XAxis
                dataKey="dateLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val >= 1000 ? `${toBnDigits(Math.round(val / 1000))}k` : toBnDigits(val)}`}
              />
              <Tooltip content={<CustomSalesTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                formatter={(value) => {
                  if (value === 'totalSales') return <span className="text-xs text-amber-400 mr-2 font-medium">মোট বিক্রয়</span>;
                  if (value === 'cashPaid') return <span className="text-xs text-emerald-400 mr-2 font-medium">নগদ আদায়</span>;
                  if (value === 'dueCreated') return <span className="text-xs text-rose-400 font-medium">বাকি বিক্রয়</span>;
                  return value;
                }}
              />
              <Area
                type="monotone"
                dataKey="totalSales"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#salesGradient)"
              />
              <Area
                type="monotone"
                dataKey="cashPaid"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#paidGradient)"
              />
              <Area
                type="monotone"
                dataKey="dueCreated"
                stroke="#f43f5e"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#dueGradient)"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
              <XAxis
                dataKey="dateLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val >= 1000 ? `${toBnDigits(Math.round(val / 1000))}k` : toBnDigits(val)}`}
              />
              <Tooltip content={<CustomSalesTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                formatter={(value) => {
                  if (value === 'cashPaid') return <span className="text-xs text-emerald-400 mr-2 font-medium">নগদ আদায়</span>;
                  if (value === 'dueCreated') return <span className="text-xs text-rose-400 font-medium">বাকি</span>;
                  return value;
                }}
              />
              <Bar dataKey="cashPaid" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="dueCreated" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==========================================
// 2. MONTHLY EXPENSE BREAKDOWNS COMPONENT
// ==========================================
interface MonthlyExpenseBreakdownProps {
  expenses: Expense[];
  settings: ShopSettings;
}

export const MonthlyExpenseBreakdownChart: React.FC<MonthlyExpenseBreakdownProps> = ({
  expenses,
  settings,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('CURRENT');
  const [viewStyle, setViewStyle] = useState<'donut' | 'bar'>('donut');

  // Available months list derived from expense records
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      const ym = e.expenseDate.slice(0, 7); // YYYY-MM
      set.add(ym);
    });
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // Current Month ISO (e.g. 2026-11)
  const currentMonthIso = useMemo(() => {
    return new Date().toISOString().slice(0, 7);
  }, []);

  // Filtered expenses based on selection
  const filteredExpenses = useMemo(() => {
    if (selectedMonth === 'ALL') return expenses;
    const targetMonth = selectedMonth === 'CURRENT' ? currentMonthIso : selectedMonth;
    return expenses.filter((e) => e.expenseDate.startsWith(targetMonth));
  }, [expenses, selectedMonth, currentMonthIso]);

  // Total amount
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Group by category with percentage and count
  const categoryData = useMemo(() => {
    const groups: Record<string, { total: number; count: number }> = {};

    filteredExpenses.forEach((e) => {
      if (!groups[e.category]) {
        groups[e.category] = { total: 0, count: 0 };
      }
      groups[e.category].total += e.amount;
      groups[e.category].count += 1;
    });

    const list = Object.entries(groups).map(([category, { total, count }]) => {
      const percentage = totalExpenseAmount > 0 ? (total / totalExpenseAmount) * 100 : 0;
      return {
        name: category,
        category,
        amount: total,
        count,
        percentage: Number(percentage.toFixed(1)),
        color: CATEGORY_COLORS[category] || '#94a3b8',
      };
    });

    // Sort descending by amount
    return list.sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalExpenseAmount]);

  // Top spending category
  const topCategory = categoryData[0] || null;

  // Custom Pie Tooltip
  const CustomExpenseTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-slate-950/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md text-xs min-w-[190px]">
          <div className="font-bold text-white flex items-center gap-2 mb-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: data.color }}
            />
            <span>{data.name}</span>
          </div>
          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span>মোট খরচ:</span>
              <span className="font-bold text-amber-400">
                {formatMoney(data.amount, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>অংশীদারিত্ব:</span>
              <span className="font-bold text-emerald-400">{toBnDigits(data.percentage)}%</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span>ভাউচার সংখ্যা:</span>
              <span>{toBnDigits(data.count)} টি</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header with Title & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              মাসিক খরচ বিশ্লেষণ (Expense Breakdown)
            </h3>
            <p className="text-xs text-slate-400">
              খাত অনুযায়ী ব্যয়ের অনুপাত ও বাজেট বণ্টন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Mode Toggle: Donut vs Bar */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewStyle('donut')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewStyle === 'donut'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ডোনাট চার্ট"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('bar')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewStyle === 'bar'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="বার চার্ট"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Month selector dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="CURRENT">চলতি মাস (নভেম্বর ২০২৬)</option>
            {availableMonths.map((ym) => {
              const [y, m] = ym.split('-');
              const bnMonth = BENGALI_MONTHS[m] || m;
              return (
                <option key={ym} value={ym}>
                  {bnMonth} {toBnDigits(y)}
                </option>
              );
            })}
            <option value="ALL">সর্বমোট সকল মাস</option>
          </select>
        </div>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400">মোট মাসিক খরচ</span>
            <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
              {formatMoney(totalExpenseAmount, settings.currencySymbol)}
            </div>
          </div>
          <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <Wallet className="w-4 h-4" />
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400">সর্বোচ্চ ব্যয়ের খাত</span>
            <div className="text-sm font-bold text-white mt-0.5 truncate max-w-[150px]">
              {topCategory ? topCategory.name : 'খরচ নেই'}
            </div>
            {topCategory && (
              <span className="text-[10px] text-amber-400 font-mono">
                {formatMoney(topCategory.amount, settings.currencySymbol)} ({toBnDigits(topCategory.percentage)}%)
              </span>
            )}
          </div>
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400">মোট খরচের খাত / ভাউচার</span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {toBnDigits(categoryData.length)}{' '}
              <span className="text-xs font-normal text-slate-400">খাত ({toBnDigits(filteredExpenses.length)} ভাউচার)</span>
            </div>
          </div>
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Layers className="w-4 h-4" />
          </span>
        </div>
      </div>

      {categoryData.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          নির্বাচিত মাসে কোনো খরচ রেকর্ড পাওয়া যায়নি।
        </div>
      ) : (
        /* Chart & Breakdown Split */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Chart Canvas (5 cols) */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[260px]">
            {viewStyle === 'donut' ? (
              <div className="relative w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#0f172a"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomExpenseTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Badge in Donut Hole */}
                <div className="absolute inset-0 m-auto flex flex-col items-center justify-center pointer-events-none text-center w-28 h-28">
                  <span className="text-[10px] text-slate-400">মোট ব্যয়</span>
                  <span className="text-xs font-bold font-mono text-white mt-0.5">
                    {formatMoney(totalExpenseAmount, settings.currencySymbol)}
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">
                    {toBnDigits(categoryData.length)} খাত
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={(val) => `${val >= 1000 ? `${toBnDigits(Math.round(val / 1000))}k` : toBnDigits(val)}`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#64748b"
                      tick={{ fill: '#cbd5e1', fontSize: 10 }}
                      width={90}
                    />
                    <Tooltip content={<CustomExpenseTooltip />} />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`bar-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Categorized Progress Bars & List (7 cols) */}
          <div className="lg:col-span-7 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {categoryData.map((item) => (
              <div
                key={item.category}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({toBnDigits(item.count)} টি)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-200 font-bold">
                      {formatMoney(item.amount, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                      {toBnDigits(item.percentage)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
