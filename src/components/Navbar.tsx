import React from 'react';
import { ShopSettings, AppUser } from '../types/pos';
import { formatMoney } from '../utils/formatters';
import {
  Truck,
  Wallet,
  Plus,
  Menu,
  Globe,
  AlertTriangle,
  Bot,
  Mic,
  User,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  settings: ShopSettings;
  cashBalance: number;
  lowStockCount: number;
  pendingOrdersCount: number;
  currentUser: AppUser | null;
  onOpenPos: () => void;
  onOpenOrders: () => void;
  onOpenAiPartner: () => void;
  onOpenAuth: () => void;
  onToggleSidebar: () => void;
  onToggleLang: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  cashBalance,
  lowStockCount,
  pendingOrdersCount,
  currentUser,
  onOpenPos,
  onOpenOrders,
  onOpenAiPartner,
  onOpenAuth,
  onToggleSidebar,
  onToggleLang,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 flex items-center justify-between">
      {/* Left brand & menu toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <Truck className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-base lg:text-lg leading-tight tracking-tight">
                {settings.shopNameBn}
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
                POS PRO v3.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {settings.tagline} · {settings.proprietor}
            </p>
          </div>
        </div>
      </div>

      {/* Right widgets */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Customer Online Orders indicator button */}
        <button
          onClick={onOpenOrders}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          title="গ্রাহক অনলাইন অর্ডার পোর্টাল"
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <span className="hidden lg:inline">অনলাইন অর্ডার</span>
          {pendingOrdersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">
              {pendingOrdersCount}
            </span>
          )}
        </button>

        {/* Live Cash In Hand Indicator (Admin/Staff only) */}
        {currentUser?.role !== 'customer' && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <span className="block text-[10px] text-slate-400 uppercase font-medium leading-none">
                ক্যাশ ব্যালেন্স
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatMoney(cashBalance, settings.currencySymbol)}
              </span>
            </div>
          </div>
        )}

        {/* User Account / Role Badge Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-all"
          title="প্রোফাইল পরিবর্তন / লগইন"
        >
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
              currentUser?.role === 'admin'
                ? 'bg-amber-500 text-slate-950'
                : currentUser?.role === 'staff'
                ? 'bg-indigo-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {currentUser?.role === 'admin' ? 'A' : currentUser?.role === 'staff' ? 'S' : 'C'}
          </div>
          <span className="hidden md:inline font-medium max-w-[100px] truncate">
            {currentUser ? currentUser.name.split(' ')[0] : 'লগইন'}
          </span>
          <span className="text-[10px] text-amber-400 uppercase font-mono">
            [{currentUser?.role || 'Guest'}]
          </span>
        </button>

        {/* AI Voice Partner Button */}
        <button
          onClick={onOpenAiPartner}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-400/30 transition-all active:scale-95"
          title="এআই ভয়েস পার্টনার ও সহকারী"
        >
          <Bot className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">এআই পার্টনার</span>
          <span className="p-0.5 rounded bg-indigo-500/40 text-amber-300">
            <Mic className="w-3 h-3" />
          </span>
        </button>

        {/* Quick New Sale button */}
        <button
          onClick={onOpenPos}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>নতুন বিক্রয়</span>
        </button>
      </div>
    </header>
  );
};
