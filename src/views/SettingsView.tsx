import React, { useState } from 'react';
import { ShopSettings } from '../types/pos';
import { StorageService } from '../utils/storage';
import {
  Settings,
  Store,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Check,
  Smartphone,
  MapPin,
  FileText,
  Save,
} from 'lucide-react';

interface SettingsViewProps {
  settings: ShopSettings;
  onUpdateSettings: (settings: ShopSettings) => void;
  onDataReset: () => void;
  recordsCount: {
    products: number;
    customers: number;
    suppliers: number;
    sales: number;
    purchases: number;
    expenses: number;
  };
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataReset,
  recordsCount,
}) => {
  const [form, setForm] = useState<ShopSettings>({ ...settings });
  const [savedAlert, setSavedAlert] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(form);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleExportBackup = () => {
    const json = StorageService.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dulal_motors_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (confirm('ব্যাকআপ ডাটা লোড করলে বর্তমান সমস্ত তথ্য প্রতিস্থাপিত হবে। আপনি কি নিশ্চিত?')) {
          const success = StorageService.importFullBackup(content);
          if (success) {
            alert('ব্যাকআপ ডাটা সফলভাবে রিস্টোর হয়েছে!');
            window.location.reload();
          } else {
            alert('ফাইলটি সঠিক ব্যাকআপ ফরম্যাট নয়।');
          }
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDemo = () => {
    if (
      confirm(
        'সতর্কতা: আপনি কি সমস্ত তথ্য মুছে ডেমো স্পেয়ার পার্টস ডাটাবেজ রিলোড করতে চান?'
      )
    ) {
      StorageService.resetAllToDefault();
      onDataReset();
      alert('ডেমো ডাটা সফলভাবে রিসেট হয়েছে!');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Settings className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              দোকানের সেটিংস ও ডাটা ব্যাকআপ
            </h2>
            <p className="text-xs text-slate-400">
              দোকানের নাম, ঠিকানা, ইনভয়েস ফুটার নোট এবং ডাটাবেজ ব্যাকআপ ব্যবস্থাপনা
            </p>
          </div>
        </div>

        {savedAlert && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>সেটিংস সংরক্ষিত হয়েছে!</span>
          </div>
        )}
      </div>

      {/* Main Split: Left Shop Info Form (7 cols) + Right Backup & Info (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Form: Shop Settings */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-400" />
            দোকান ও মেমো তথ্য
          </h3>

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  দোকানের নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={form.shopNameBn}
                  onChange={(e) => setForm({ ...form, shopNameBn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  দোকানের নাম (English) *
                </label>
                <input
                  type="text"
                  required
                  value={form.shopName}
                  onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">
                  দোকানের স্লোগান / ট্যাগলাইন
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  প্রোপ্রাইটর / মালিকের নাম
                </label>
                <input
                  type="text"
                  value={form.proprietor}
                  onChange={(e) => setForm({ ...form, proprietor: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  কারেন্সি প্রতীক
                </label>
                <input
                  type="text"
                  value={form.currencySymbol}
                  onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  মোবাইল নম্বর ১ *
                </label>
                <input
                  type="text"
                  required
                  value={form.phone1}
                  onChange={(e) => setForm({ ...form, phone1: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  মোবাইল নম্বর ২ (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={form.phone2}
                  onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">
                  দোকানের ঠিকানা *
                </label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">
                  ইনভয়েস / ক্যাশ মেমোর ফুটার নোট
                </label>
                <textarea
                  rows={2}
                  value={form.invoiceFooterNote}
                  onChange={(e) => setForm({ ...form, invoiceFooterNote: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
              >
                <Save className="w-4 h-4" />
                <span>পরিবর্তন সংরক্ষণ করুন</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Database Backup & Diagnostics */}
        <div className="lg:col-span-5 space-y-4">
          {/* Backup & Restore Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              ডাটাবেজ ব্যাকআপ ও রিস্টোর
            </h3>

            <p className="text-xs text-slate-400">
              আপনার সমস্ত ইনভয়েস, স্টক ও লেনদেন সুরক্ষিত রাখতে নিয়মিত ব্যাকআপ ডাউনলোড করে রাখুন।
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>সম্পূর্ণ ডাটাবেজ ব্যাকআপ (JSON ডাউনলোড)</span>
              </button>

              <label className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>ব্যাকআপ ফাইল থেকে রিস্টোর করুন</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleResetToDemo}
                className="w-full py-2 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>আসল ডেমো ডাটা রিলোড করুন (Reset)</span>
              </button>
            </div>
          </div>

          {/* Database Diagnostics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ডাটাবেজ পরিসংখ্যান ও স্ট্যাটাস
            </h4>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>মোট পণ্য সংখ্যা:</span>
                <span className="font-mono text-white font-medium">{recordsCount.products} টি</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>নিবন্ধিত কাস্টমার:</span>
                <span className="font-mono text-white font-medium">{recordsCount.customers} জন</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>মহাজন / সাপ্লায়ার:</span>
                <span className="font-mono text-white font-medium">{recordsCount.suppliers} টি</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>মোট বিক্রয় ইনভয়েস:</span>
                <span className="font-mono text-white font-medium">{recordsCount.sales} টি</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>ক্রয় চালান:</span>
                <span className="font-mono text-white font-medium">{recordsCount.purchases} টি</span>
              </div>
              <div className="flex justify-between py-1 text-slate-400">
                <span>দোকানের খরচ এন্ট্রি:</span>
                <span className="font-mono text-white font-medium">{recordsCount.expenses} টি</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>লোকাল ডাটাবেজ সক্রিয় এবং সম্পূর্ণ অফলাইন কাজ করতে সক্ষম।</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
