import React, { useState, useMemo } from 'react';
import { Customer, Sale, Collection, ShopSettings, PaymentMethod } from '../types/pos';
import { formatMoney, formatDateTime } from '../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MapPin,
  Tractor,
  HandCoins,
  FileText,
  Edit2,
  Trash2,
  Eye,
  Printer,
  X,
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  sales: Sale[];
  collections: Collection[];
  settings: ShopSettings;
  getCustomerDue: (customerId: number) => number;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: number) => void;
  onOpenCollectionModal: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  sales,
  collections,
  settings,
  getCustomerDue,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onOpenCollectionModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dueOnlyFilter, setDueOnlyFilter] = useState(false);

  // New / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  // Customer Statement Modal
  const [selectedStatementCustomer, setSelectedStatementCustomer] = useState<Customer | null>(
    null
  );

  const startEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setVehicleType(c.vehicleType || '');
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setVehicleType('');
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('কাস্টমারের নাম লিখুন।');
      return;
    }

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        vehicleType: vehicleType.trim() || undefined,
      });
      alert('কাস্টমার তথ্য আপডেট হয়েছে!');
    } else {
      onAddCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        vehicleType: vehicleType.trim() || undefined,
      });
      alert('নতুন কাস্টমার সফলভাবে যোগ হয়েছে!');
    }

    setShowModal(false);
    resetForm();
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.vehicleType && c.vehicleType.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (dueOnlyFilter) {
        return getCustomerDue(c.id) > 0;
      }

      return true;
    });
  }, [customers, searchQuery, dueOnlyFilter, getCustomerDue]);

  // Customer statement data
  const customerStatementData = useMemo(() => {
    if (!selectedStatementCustomer) return { history: [], totalSales: 0, totalPaid: 0, currentDue: 0 };

    const cId = selectedStatementCustomer.id;
    const cSales = sales.filter((s) => s.customerId === cId);
    const cCollections = collections.filter((col) => col.customerId === cId);

    // Merge sales and collections into chronological ledger
    const history: Array<{
      date: string;
      type: 'Sale' | 'Payment';
      reference: string;
      description: string;
      debit: number; // Sale amount
      credit: number; // Payment amount
    }> = [];

    cSales.forEach((s) => {
      history.push({
        date: s.saleDate,
        type: 'Sale',
        reference: s.invoiceNo,
        description: s.items.map((i) => `${i.productName} (${i.qty})`).join(', '),
        debit: s.total,
        credit: s.paid,
      });
    });

    cCollections.forEach((c) => {
      history.push({
        date: c.collectionDate,
        type: 'Payment',
        reference: c.voucherNo || `COL-#${c.id}`,
        description: c.note || 'বকেয়া নগদ আদায়',
        debit: 0,
        credit: c.amount,
      });
    });

    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalSales = cSales.reduce((sum, s) => sum + s.total, 0);
    const totalPaid = cSales.reduce((sum, s) => sum + s.paid, 0) + cCollections.reduce((sum, c) => sum + c.amount, 0);
    const currentDue = getCustomerDue(cId);

    return { history, totalSales, totalPaid, currentDue };
  }, [selectedStatementCustomer, sales, collections, getCustomerDue]);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              কাস্টমার খাতা ও বাকি তালিকা
            </h2>
            <p className="text-xs text-slate-400">
              মোট নিবন্ধিত খদ্দের: {customers.length} জন · নিয়মিত খতিয়ান
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>+ নতুন কাস্টমার যোগ</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="নাম, মোবাইল বা গাড়ি দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={() => setDueOnlyFilter((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            dueOnlyFilter
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          {dueOnlyFilter ? '✓ শুধু বাকি আছে এমন খদ্দের' : 'সব খদ্দের দেখুন'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">কাস্টমারের নাম</th>
                <th className="py-3 px-3">মোবাইল</th>
                <th className="py-3 px-3">গাড়ি / ট্র্যাক্টর মডেল</th>
                <th className="py-3 px-3">ঠিকানা</th>
                <th className="py-3 px-3 text-right">মোট ক্রয়</th>
                <th className="py-3 px-3 text-right">বর্তমান বকেয়া (Due)</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    কোনো কাস্টমার খুঁজে পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const currentDue = getCustomerDue(c.id);
                  const custSales = sales.filter((s) => s.customerId === c.id);
                  const totalBought = custSales.reduce((sum, s) => sum + s.total, 0);

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: #{c.id}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {c.phone || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {c.vehicleType ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            <Tractor className="w-3 h-3" />
                            {c.vehicleType}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 max-w-[150px] truncate">
                        {c.address || '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                        {formatMoney(totalBought, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                        {currentDue > 0 ? (
                          <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            {formatMoney(currentDue, settings.currencySymbol)}
                          </span>
                        ) : (
                          <span className="text-emerald-400">০.০০</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {currentDue > 0 && (
                            <button
                              onClick={() => onOpenCollectionModal(c)}
                              className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
                              title="বাকি আদায় করুন"
                            >
                              আদায়
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedStatementCustomer(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="লেজার খতিয়ান দেখুন"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => startEdit(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`আপনি কি "${c.name}" কাস্টমার মুছে ফেলতে চান?`)) {
                                onDeleteCustomer(c.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              {editingCustomer ? 'কাস্টমার তথ্য সংশোধন' : 'নতুন কাস্টমার নিবন্ধন'}
            </h3>

            <form onSubmit={handleSaveCustomer} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  কাস্টমারের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
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
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                >
                  {editingCustomer ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Statement / Ledger Modal */}
      {selectedStatementCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            {/* Top Bar */}
            <div className="no-print flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-base">কাস্টমার লেজার খতিয়ান</h3>
                  <div className="text-xs text-slate-400">
                    {selectedStatementCustomer.name} · {selectedStatementCustomer.phone || 'ফোন নেই'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  <Printer className="w-3.5 h-3.5" />
                  প্রিন্ট
                </button>
                <button
                  onClick={() => setSelectedStatementCustomer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Statement Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 space-y-4">
              {/* Summary Bar */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs">
                <div>
                  <div className="text-slate-400">মোট কেনাকাটা</div>
                  <div className="font-mono font-bold text-white text-sm mt-0.5">
                    {formatMoney(customerStatementData.totalSales, settings.currencySymbol)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">সর্বমোট জমা</div>
                  <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                    {formatMoney(customerStatementData.totalPaid, settings.currencySymbol)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">বর্তমান অবশিষ্ট বকেয়া</div>
                  <div className="font-mono font-bold text-rose-400 text-sm mt-0.5">
                    {formatMoney(customerStatementData.currentDue, settings.currencySymbol)}
                  </div>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px] uppercase font-semibold">
                      <th className="p-2.5">তারিখ</th>
                      <th className="p-2.5">ভাউচার / ইনভয়েস</th>
                      <th className="p-2.5">বিবরণ</th>
                      <th className="p-2.5 text-right">বিল (ডেবিট)</th>
                      <th className="p-2.5 text-right">জমা (ক্রেডিট)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {customerStatementData.history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500 text-xs">
                          কোনো পূর্ববর্তী লেনদেন পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      customerStatementData.history.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-800/40">
                          <td className="p-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {formatDateTime(h.date)}
                          </td>
                          <td className="p-2.5 font-mono text-amber-400 whitespace-nowrap">
                            {h.reference}
                          </td>
                          <td className="p-2.5 text-slate-300 max-w-[200px] truncate">
                            {h.description}
                          </td>
                          <td className="p-2.5 text-right font-mono font-medium text-white whitespace-nowrap">
                            {h.debit > 0 ? formatMoney(h.debit, settings.currencySymbol) : '—'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {h.credit > 0 ? formatMoney(h.credit, settings.currencySymbol) : '—'}
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
      )}
    </div>
  );
};
