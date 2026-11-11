import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, PaymentMethod, ShopSettings } from '../types/pos';
import { formatMoney, formatDateTime } from '../utils/formatters';
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  PieChart,
  Tag,
  DollarSign,
  TrendingDown,
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  settings: ShopSettings;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: number) => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'দোকান ভাড়া',
  'বিদ্যুৎ ও ওয়াইফাই বিল',
  'কর্মচারী বেতন',
  'পরিবহন ও যাতায়াত',
  'চা-নাস্তা ও আপ্যায়ন',
  'মেরামত ও রক্ষণাবেক্ষণ',
  'প্যাকিং ও স্টেশনারি',
  'অন্যান্য খরচ',
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  settings,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [category, setCategory] = useState<ExpenseCategory>('চা-নাস্তা ও আপ্যায়ন');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      alert('সঠিক খরচের পরিমাণ লিখুন।');
      return;
    }

    if (!description.trim()) {
      alert('খরচের বিবরণ লিখুন।');
      return;
    }

    onAddExpense({
      expenseDate: new Date(expenseDate).toISOString(),
      category,
      description: description.trim(),
      amount: parsed,
      paymentMethod,
    });

    setDescription('');
    setAmount('');
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(
      (e) => categoryFilter === 'ALL' || e.category === categoryFilter
    );
  }, [expenses, categoryFilter]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Breakdown by category
  const categoryBreakdown = useMemo(() => {
    const map: { [key: string]: number } = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <Receipt className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              দোকানের দৈনন্দিন খরচ (Business Expenses)
            </h2>
            <p className="text-xs text-slate-400">
              দোকান ভাড়া, কর্মচারী বেতন, আপ্যায়ন ও পরিবহন খরচ হিসাব
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">মোট খরচ:</span>
          <span className="text-base font-bold font-mono text-rose-400">
            {formatMoney(totalExpense, settings.currencySymbol)}
          </span>
        </div>
      </div>

      {/* Main Split: Left Form (5 cols) + Right List (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Add Expense Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center gap-2">
            <Plus className="w-4 h-4 text-rose-400" />
            নতুন খরচ এন্ট্রি
          </h3>

          <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">খরচের খাত (ক্যাটেগরি) *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-rose-400 font-bold text-base focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                বিবরণ / কারণ *
              </label>
              <textarea
                rows={2}
                required
                placeholder="যেমন: খদ্দের ও মেকানিকদের জন্য মিষ্টি ও চা"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">পেমেন্ট মেথড</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                >
                  <option value="Cash">ক্যাশ (Cash)</option>
                  <option value="bKash">বিকাশ / নগদ</option>
                  <option value="Bank">ব্যাংক</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">খরচের তারিখ</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-500/20 transition-all"
            >
              খরচ সংরক্ষণ করুন
            </button>
          </form>

          {/* Category breakdown summary */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <h4 className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-amber-400" />
              খাতওয়ারি খরচের সারসংক্ষেপ
            </h4>
            <div className="space-y-1.5">
              {categoryBreakdown.map(([cat, amt]) => {
                const percent = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(0) : 0;
                return (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[180px]">{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{percent}%</span>
                      <span className="font-mono font-medium text-slate-200">
                        {formatMoney(amt, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Expense History Table (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">খরচের খতিয়ান</h3>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
            >
              <option value="ALL">সকল খাত</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[10px] uppercase">
                  <th className="pb-2">তারিখ</th>
                  <th className="pb-2">খাত</th>
                  <th className="pb-2">বিবরণ</th>
                  <th className="pb-2 text-right">পরিমাণ</th>
                  <th className="pb-2 text-center">মুছুন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      কোনো খরচ পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  [...filteredExpenses]
                    .sort(
                      (a, b) =>
                        new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
                    )
                    .map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {formatDateTime(exp.expenseDate)}
                        </td>
                        <td className="py-2.5 text-slate-200 font-medium whitespace-nowrap">
                          {exp.category}
                        </td>
                        <td className="py-2.5 text-slate-400 max-w-[200px] truncate">
                          {exp.description}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                          {formatMoney(exp.amount, settings.currencySymbol)}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => {
                              if (confirm('আপনি কি এই খরচের এন্ট্রি মুছে ফেলতে চান?')) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
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
      </div>
    </div>
  );
};
