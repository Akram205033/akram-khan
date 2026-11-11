import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  Users,
  HandCoins,
  Receipt,
  History,
  TrendingUp,
  Settings,
  X,
  ShieldCheck,
  RotateCcw,
  UserCheck,
  Bot,
  Sparkles,
  ShoppingBag,
  Lock,
} from 'lucide-react';
import { AppUser } from '../types/pos';

export type PageId =
  | 'dashboard'
  | 'pos'
  | 'orders'
  | 'salesHistory'
  | 'products'
  | 'purchases'
  | 'customers'
  | 'collection'
  | 'staff'
  | 'expenses'
  | 'cash'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
  lowStockCount: number;
  totalDueCount: number;
  pendingOrdersCount: number;
  currentUser: AppUser | null;
  onOpenAiPartner: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isOpen,
  onClose,
  lowStockCount,
  totalDueCount,
  pendingOrdersCount,
  currentUser,
  onOpenAiPartner,
  onOpenAuth,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff' || isAdmin;

  const menuItems: Array<{
    id: PageId;
    labelBn: string;
    labelEn: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
    adminOnly?: boolean;
  }> = [
    {
      id: 'dashboard',
      labelBn: 'ড্যাশবোর্ড',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'pos',
      labelBn: 'সেলস কাউন্টার (POS)',
      labelEn: 'Sales Entry / POS',
      icon: ShoppingCart,
    },
    {
      id: 'orders',
      labelBn: 'গ্রাহক অর্ডার পোর্টাল',
      labelEn: 'Customer Orders & Catalog',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} নতুন` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'salesHistory',
      labelBn: 'সেলস হিস্ট্রি ও রিটার্ন',
      labelEn: 'Sales History & Returns',
      icon: RotateCcw,
    },
    {
      id: 'products',
      labelBn: 'পণ্য ও স্টক',
      labelEn: 'Products & Stock',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} কম` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    },
    {
      id: 'purchases',
      labelBn: 'মহাজন ক্রয় এন্ট্রি',
      labelEn: 'Purchase Entry',
      icon: Truck,
      adminOnly: true,
    },
    {
      id: 'customers',
      labelBn: 'কাস্টমার ও বাকি খাতা',
      labelEn: 'Customers & Due',
      icon: Users,
    },
    {
      id: 'collection',
      labelBn: 'বাকি আদায় (কালেকশন)',
      labelEn: 'Customer Collection',
      icon: HandCoins,
      badge: totalDueCount > 0 ? `${totalDueCount} বাকি` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    {
      id: 'staff',
      labelBn: 'স্টাফ হাজিরা ও বেতন',
      labelEn: 'Staff & Attendance',
      icon: UserCheck,
    },
    {
      id: 'expenses',
      labelBn: 'দোকানের খরচ',
      labelEn: 'Business Expenses',
      icon: Receipt,
      adminOnly: true,
    },
    {
      id: 'cash',
      labelBn: 'ক্যাশ বুক ও লেনদেন',
      labelEn: 'Cash Register & History',
      icon: History,
      adminOnly: true,
    },
    {
      id: 'reports',
      labelBn: 'রিপোর্ট ও লাভ-ক্ষতি',
      labelEn: 'Reports & Analytics',
      icon: TrendingUp,
      adminOnly: true,
    },
    {
      id: 'settings',
      labelBn: 'সেটিংস ও ব্যাকআপ',
      labelEn: 'Settings & Backup',
      icon: Settings,
      adminOnly: true,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`no-print fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile header inside sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base">দুলাল মোটরস</span>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">
              MENU
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Partner Callout Banner */}
        <div className="p-3 pb-1">
          <button
            onClick={() => {
              onOpenAiPartner();
              onClose();
            }}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 hover:border-indigo-400 text-left transition-all group flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>এআই পার্টনার</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <div className="text-[10px] text-indigo-300">ভয়েস সহকারী ও গাইড</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500 text-white">
              MIC
            </span>
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            মেনু ও মডিউল
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const isLocked = item.adminOnly && !isAdmin;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isLocked) {
                    alert('এই মডিউলটি শুধুমাত্র দোকানের অ্যাডমিন / মালিকের জন্য সংরক্ষিত।');
                    onOpenAuth();
                    return;
                  }
                  onSelectPage(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : isLocked
                    ? 'text-slate-500 hover:bg-slate-950/40 opacity-70 cursor-not-allowed'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-slate-950 stroke-[2.4]' : isLocked ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  />
                  <div className="truncate">
                    <span className="block truncate leading-tight text-xs sm:text-sm">{item.labelBn}</span>
                    <span
                      className={`block text-[10px] truncate leading-tight ${
                        isActive ? 'text-slate-800 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {item.labelEn}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isLocked && <Lock className="w-3 h-3 text-slate-600" />}
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ml-1 ${
                        isActive ? 'bg-slate-950/20 text-slate-950' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* User Account Bar in Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 text-xs">
          <button
            onClick={onOpenAuth}
            className="w-full p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  currentUser?.role === 'admin'
                    ? 'bg-amber-500 text-slate-950'
                    : currentUser?.role === 'staff'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {currentUser?.name ? currentUser.name[0] : 'U'}
              </div>
              <div className="truncate">
                <div className="font-semibold text-white truncate text-xs">
                  {currentUser?.name || 'লগইন করুন'}
                </div>
                <div className="text-[10px] text-amber-400 uppercase font-mono">
                  {currentUser?.role || 'Guest'}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">পরিবর্তন ▾</span>
          </button>
        </div>
      </aside>
    </>
  );
};
