import React, { useState, useMemo } from 'react';
import { Staff, StaffAttendance, StaffSalaryPayment, PaymentMethod, ShopSettings } from '../types/pos';
import { formatMoney, formatDateTime, formatDateOnly, generateInvoiceNumber } from '../utils/formatters';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  DollarSign,
  Plus,
  Calendar,
  CheckCircle,
  Printer,
  FileText,
  Trash2,
  Edit2,
  Award,
} from 'lucide-react';

interface StaffViewProps {
  staffList: Staff[];
  attendanceList: StaffAttendance[];
  salaryPayments: StaffSalaryPayment[];
  settings: ShopSettings;
  salaryPaymentsCount: number;
  onAddStaff: (staff: Omit<Staff, 'id'>) => void;
  onUpdateStaff: (staff: Staff) => void;
  onDeleteStaff: (id: number) => void;
  onSaveAttendanceBatch: (records: StaffAttendance[]) => void;
  onDisburseSalary: (payment: StaffSalaryPayment) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staffList,
  attendanceList,
  salaryPayments,
  settings,
  salaryPaymentsCount,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onSaveAttendanceBatch,
  onDisburseSalary,
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'staff' | 'salary'>('attendance');

  // Attendance Date
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  // Current day attendance state
  const [dailyAttendanceMap, setDailyAttendanceMap] = useState<{
    [staffId: number]: { status: 'present' | 'absent' | 'late' | 'leave'; note: string };
  }>({});

  // Add / Edit Staff Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('সেলসম্যান ও পার্টস সহকারী');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffSalary, setStaffSalary] = useState('');

  // Salary Disbursement Modal
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedStaffForSalary, setSelectedStaffForSalary] = useState<Staff | null>(null);
  const [salaryMonth, setSalaryMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [advanceDeduction, setAdvanceDeduction] = useState<string>('0');
  const [bonusAmount, setBonusAmount] = useState<string>('0');
  const [salaryPayMethod, setSalaryPayMethod] = useState<PaymentMethod>('Cash');
  const [salaryNote, setSalaryNote] = useState<string>('');

  // Salary Slip Modal
  const [activeSalarySlip, setActiveSalarySlip] = useState<StaffSalaryPayment | null>(null);

  // Initialize or fetch attendance for date
  const dateAttendance = useMemo(() => {
    return attendanceList.filter((a) => a.date === attendanceDate);
  }, [attendanceList, attendanceDate]);

  const handleAttendanceChange = (
    staffId: number,
    status: 'present' | 'absent' | 'late' | 'leave'
  ) => {
    setDailyAttendanceMap((prev) => ({
      ...prev,
      [staffId]: {
        status,
        note: prev[staffId]?.note || '',
      },
    }));
  };

  const handleSaveAttendance = () => {
    const records: StaffAttendance[] = staffList.map((s) => {
      const entry = dailyAttendanceMap[s.id] || { status: 'present', note: '' };
      return {
        id: Date.now() + s.id,
        staffId: s.id,
        staffName: s.name,
        date: attendanceDate,
        status: entry.status,
        note: entry.note,
      };
    });

    onSaveAttendanceBatch(records);
    alert('আজকের হাজিরা সফলভাবে সংরক্ষিত হয়েছে!');
  };

  // Add/Edit staff handler
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      alert('কর্মচারীর নাম লিখুন।');
      return;
    }
    const sal = parseFloat(staffSalary);
    if (isNaN(sal) || sal <= 0) {
      alert('সঠিক মাসিক বেতন লিখুন।');
      return;
    }

    if (editingStaff) {
      onUpdateStaff({
        ...editingStaff,
        name: staffName.trim(),
        role: staffRole.trim(),
        phone: staffPhone.trim(),
        monthlySalary: sal,
      });
      alert('কর্মচারীর তথ্য আপডেট হয়েছে!');
    } else {
      onAddStaff({
        name: staffName.trim(),
        role: staffRole.trim(),
        phone: staffPhone.trim(),
        monthlySalary: sal,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
      });
      alert('নতুন কর্মচারী সফলভাবে যোগ হয়েছে!');
    }

    setShowStaffModal(false);
    setEditingStaff(null);
    setStaffName('');
    setStaffRole('সেলসম্যান ও পার্টস সহকারী');
    setStaffPhone('');
    setStaffSalary('');
  };

  // Open Salary Modal
  const handleOpenSalaryDisburse = (staff: Staff) => {
    setSelectedStaffForSalary(staff);
    setAdvanceDeduction('0');
    setBonusAmount('0');
    setSalaryNote(`${salaryMonth} মাসের বেতন`);
    setShowSalaryModal(true);
  };

  // Calculate Net Salary
  const calculatedSalary = useMemo(() => {
    if (!selectedStaffForSalary) return { base: 0, advance: 0, bonus: 0, net: 0 };
    const base = selectedStaffForSalary.monthlySalary;
    const adv = parseFloat(advanceDeduction) || 0;
    const bon = parseFloat(bonusAmount) || 0;
    const net = Math.max(0, base - adv + bon);
    return { base, advance: adv, bonus: bon, net };
  }, [selectedStaffForSalary, advanceDeduction, bonusAmount]);

  // Submit Salary
  const handleConfirmSalaryDisburse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForSalary) return;

    const voucher = generateInvoiceNumber('SAL-PAY', salaryPaymentsCount);
    const newPayment: StaffSalaryPayment = {
      id: Date.now(),
      staffId: selectedStaffForSalary.id,
      staffName: selectedStaffForSalary.name,
      month: salaryMonth,
      baseSalary: calculatedSalary.base,
      presentDays: 26, // full month work standard
      absentDays: 0,
      advanceDeduction: calculatedSalary.advance,
      bonus: calculatedSalary.bonus,
      netPaid: calculatedSalary.net,
      paymentDate: new Date().toISOString(),
      paymentMethod: salaryPayMethod,
      voucherNo: voucher,
      note: salaryNote.trim(),
    };

    onDisburseSalary(newPayment);
    setShowSalaryModal(false);
    setActiveSalarySlip(newPayment);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              স্টাফ হাজিরা ও বেতন ব্যবস্থাপনা
            </h2>
            <p className="text-xs text-slate-400">
              দৈনিক হাজিরা পঞ্চ, অগ্রিম কর্তন এবং মাসিক বেতন প্রদান
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'attendance'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            দৈনিক হাজিরা
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'staff'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            স্টাফ তালিকা ({staffList.length})
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'salary'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            বেতন শিট ও হিস্টোরি
          </button>
        </div>
      </div>

      {/* Tab 1: Daily Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">দৈনিক হাজিরা খাতা</h3>
              <p className="text-xs text-slate-400">
                প্রতি কর্মচারীর স্ট্যাটাস সিলেক্ট করে নিচে সংরক্ষণ বাটনে চাপুন
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">তারিখ:</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">কর্মচারীর নাম</th>
                  <th className="py-3 px-3">পদবী / রোল</th>
                  <th className="py-3 px-3">মোবাইল</th>
                  <th className="py-3 px-3 text-center">উপস্থিতি নির্ধারণ</th>
                  <th className="py-3 px-4">মন্তব্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staffList.map((s) => {
                  const existing = dateAttendance.find((a) => a.staffId === s.id);
                  const currentStatus =
                    dailyAttendanceMap[s.id]?.status || existing?.status || 'present';

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{s.name}</div>
                        <div className="text-[10px] text-amber-400 font-mono">
                          বেতন: {formatMoney(s.monthlySalary, settings.currencySymbol)}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{s.role}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono">{s.phone}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                          <button
                            type="button"
                            onClick={() => handleAttendanceChange(s.id, 'present')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                              currentStatus === 'present'
                                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            উপস্থিত
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceChange(s.id, 'late')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            দেরি
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceChange(s.id, 'leave')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                              currentStatus === 'leave'
                                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            ছুটি
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceChange(s.id, 'absent')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                              currentStatus === 'absent'
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            অনুপস্থিত
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="নোট (ঐচ্ছিক)..."
                          value={dailyAttendanceMap[s.id]?.note ?? (existing?.note || '')}
                          onChange={(e) =>
                            setDailyAttendanceMap((prev) => ({
                              ...prev,
                              [s.id]: {
                                status: currentStatus,
                                note: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              onClick={handleSaveAttendance}
              className="px-5 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
            >
              হাজিরা সংরক্ষণ করুন
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Staff Directory */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">
              দোকানের সকল নিয়োজিত কর্মচারীদের তালিকা
            </span>
            <button
              onClick={() => {
                setEditingStaff(null);
                setStaffName('');
                setStaffRole('সেলসম্যান ও পার্টস সহকারী');
                setStaffPhone('');
                setStaffSalary('');
                setShowStaffModal(true);
              }}
              className="px-3.5 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm"
            >
              + নতুন স্টাফ নিয়োগ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((st) => (
              <div
                key={st.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{st.name}</h4>
                      <div className="text-xs text-amber-400 font-medium mt-0.5">{st.role}</div>
                    </div>
                    <span className="p-2 rounded-xl bg-slate-800 text-indigo-400">
                      <Users className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-slate-400 space-y-1">
                    <div>মোবাইল: {st.phone}</div>
                    <div>যোগদান: {st.joinDate}</div>
                    <div className="font-mono text-emerald-400 font-semibold text-sm pt-1">
                      মূল মাসিক বেতন: {formatMoney(st.monthlySalary, settings.currencySymbol)}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenSalaryDisburse(st)}
                    className="flex-1 py-1.5 rounded-xl font-bold text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                  >
                    বেতন দিন
                  </button>
                  <button
                    onClick={() => {
                      setEditingStaff(st);
                      setStaffName(st.name);
                      setStaffRole(st.role);
                      setStaffPhone(st.phone);
                      setStaffSalary(st.monthlySalary.toString());
                      setShowStaffModal(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    title="এডিট"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`আপনি কি "${st.name}" কে স্টাফ তালিকা থেকে মুছে ফেলতে চান?`)) {
                        onDeleteStaff(st.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                    title="মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Salary Payments & History */}
      {activeTab === 'salary' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>মোট বেতন ভাউচার: {salaryPayments.length} টি</span>
            <span className="font-mono text-emerald-400 font-bold">
              পরিশোধিত মোট বেতন: {formatMoney(salaryPayments.reduce((s, p) => s + p.netPaid, 0), settings.currencySymbol)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">ভাউচার নং</th>
                  <th className="py-3 px-3">তারিখ</th>
                  <th className="py-3 px-3">মাস</th>
                  <th className="py-3 px-3">কর্মচারীর নাম</th>
                  <th className="py-3 px-3 text-right">মূল বেতন</th>
                  <th className="py-3 px-3 text-right">অগ্রিম কর্তন</th>
                  <th className="py-3 px-3 text-right">বোনাস</th>
                  <th className="py-3 px-3 text-right">প্রদত্ত নিট বেতন</th>
                  <th className="py-3 px-4 text-center">রসিদ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {salaryPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                      এখনো কোনো বেতন প্রদান রেকর্ড করা হয়নি। স্টাফ তালিকা থেকে "বেতন দিন" বাটনে চাপুন।
                    </td>
                  </tr>
                ) : (
                  salaryPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        {p.voucherNo}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {formatDateTime(p.paymentDate)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-amber-400 whitespace-nowrap">
                        {p.month}
                      </td>
                      <td className="py-3 px-3 text-white font-medium">{p.staffName}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatMoney(p.baseSalary, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-400">
                        -{formatMoney(p.advanceDeduction, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">
                        +{formatMoney(p.bonus, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                        {formatMoney(p.netPaid, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setActiveSalarySlip(p)}
                          className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                          title="বেতন স্লিপ দেখুন ও প্রিন্ট করুন"
                        >
                          <FileText className="w-4 h-4" />
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

      {/* Add / Edit Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              {editingStaff ? 'কর্মচারীর তথ্য সংশোধন' : 'নতুন কর্মচারী নিবন্ধন'}
            </h3>

            <form onSubmit={handleSaveStaff} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  কর্মচারীর নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ শফিকুল ইসলাম"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  পদবী / কাজের ধরন *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: সেলসম্যান / মেকানিক / হিসাবরক্ষক"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
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
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  মাসিক মূল বেতন (৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  placeholder="15000"
                  value={staffSalary}
                  onChange={(e) => setStaffSalary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-emerald-400 font-bold focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
                >
                  {editingStaff ? 'আপডেট করুন' : 'নিয়োগ সম্পন্ন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Disbursement Modal */}
      {showSalaryModal && selectedStaffForSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              মাসিক বেতন প্রদান
            </h3>

            <div className="p-3 my-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="font-semibold text-white">{selectedStaffForSalary.name}</div>
              <div className="text-amber-400">{selectedStaffForSalary.role}</div>
              <div className="text-slate-400 mt-1">
                মাসিক মূল বেতন: {formatMoney(selectedStaffForSalary.monthlySalary, settings.currencySymbol)}
              </div>
            </div>

            <form onSubmit={handleConfirmSalaryDisburse} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">কোন মাসের বেতন?</label>
                <input
                  type="month"
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    অগ্রিম কর্তন (Advance) ৳
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={advanceDeduction}
                    onChange={(e) => setAdvanceDeduction(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-rose-400 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    বোনাস / ইনসেনটিভ ৳
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={salaryPayMethod}
                  onChange={(e) => setSalaryPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                >
                  <option value="Cash">ক্যাশ (Cash)</option>
                  <option value="bKash">বিকাশ / নগদ</option>
                  <option value="Bank">ব্যাংক অ্যাকাউন্ট</option>
                </select>
              </div>

              {/* Net Payable Highlight */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <span className="font-bold text-slate-200">প্রদেয় নিট বেতন:</span>
                <span className="font-mono font-bold text-emerald-400 text-base">
                  {formatMoney(calculatedSalary.net, settings.currencySymbol)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md"
                >
                  বেতন প্রদান নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Slip Printable Modal */}
      {activeSalarySlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">কর্মচারী বেতন স্লিপ</h3>
              <button
                onClick={() => setActiveSalarySlip(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Printable Slip Container */}
            <div className="p-4 bg-white text-slate-900 rounded-xl space-y-3 text-xs">
              <div className="text-center border-b pb-2">
                <div className="font-bold text-base">{settings.shopNameBn}</div>
                <div className="text-[10px] text-slate-500">{settings.address}</div>
                <div className="font-semibold text-slate-800 mt-1 uppercase text-[11px]">
                  বেতন পরিশোধ ভাউচার
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">ভাউচার নং:</span>
                  <span className="font-mono font-bold">{activeSalarySlip.voucherNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">কর্মচারী:</span>
                  <span className="font-bold">{activeSalarySlip.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">বেতনের মাস:</span>
                  <span className="font-medium text-amber-700">{activeSalarySlip.month}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">তারিখ:</span>
                  <span>{formatDateTime(activeSalarySlip.paymentDate)}</span>
                </div>
              </div>

              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>মাসিক মূল বেতন:</span>
                  <span className="font-mono">{formatMoney(activeSalarySlip.baseSalary, settings.currencySymbol)}</span>
                </div>
                {activeSalarySlip.advanceDeduction > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>অগ্রিম কর্তন:</span>
                    <span className="font-mono">-{formatMoney(activeSalarySlip.advanceDeduction, settings.currencySymbol)}</span>
                  </div>
                )}
                {activeSalarySlip.bonus > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>বোনাস / ইনসেনটিভ:</span>
                    <span className="font-mono">+{formatMoney(activeSalarySlip.bonus, settings.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t pt-1">
                  <span>পরিশোধিত মোট বেতন:</span>
                  <span className="font-mono">{formatMoney(activeSalarySlip.netPaid, settings.currencySymbol)}</span>
                </div>
              </div>

              <div className="pt-6 flex justify-between text-[10px] text-slate-500 border-t">
                <div>কর্মচারীর স্বাক্ষর</div>
                <div>কর্তৃপক্ষের স্বাক্ষর</div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-amber-500 text-slate-950 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                প্রিন্ট স্লিপ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
