import React, { useState } from 'react';
import { AppUser, UserRole } from '../types/pos';
import {
  Lock,
  User,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle,
  X,
  LogIn,
  UserPlus,
  KeyRound,
  Tractor,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  onRegister: (newUser: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onLogin,
  onRegister,
  onLogout,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<UserRole>('staff');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = phoneOrEmail.trim().toLowerCase();
    const user = users.find(
      (u) =>
        (u.phone.replace(/[^0-9]/g, '') === query.replace(/[^0-9]/g, '') ||
          (u.email && u.email.toLowerCase() === query)) &&
        (!u.password || u.password === password.trim())
    );

    if (user) {
      onLogin(user);
      onClose();
      alert(`স্বাগতম, ${user.name}! আপনি সফলভাবে ${user.role === 'admin' ? 'অ্যাডমিন' : user.role === 'staff' ? 'স্টাফ' : 'গ্রাহক'} হিসেবে লগইন করেছেন।`);
    } else {
      alert('মোবাইল নম্বর অথবা পাসওয়ার্ড সঠিক নয়। ডেমো লগইন বাটনগুলো ব্যবহার করতে পারেন।');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneOrEmail.trim() || !password.trim()) {
      alert('অনুগ্রহ করে সকল তথ্য পূরণ করুন।');
      return;
    }

    onRegister({
      name: name.trim(),
      phone: phoneOrEmail.trim(),
      email: phoneOrEmail.includes('@') ? phoneOrEmail.trim() : undefined,
      password: password.trim(),
      role,
    });

    onClose();
    alert('অভিনন্দন! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে এবং আপনি লগইন করেছেন।');
  };

  const quickLoginAs = (targetRole: UserRole) => {
    const target = users.find((u) => u.role === targetRole);
    if (target) {
      onLogin(target);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 overflow-hidden space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {currentUser ? 'লগইন প্রোফাইল ও অ্যাক্সেস' : mode === 'login' ? 'সুরক্ষিত লগইন' : 'নতুন অ্যাকাউন্ট তৈরি'}
              </h3>
              <p className="text-xs text-slate-400">
                অ্যাডমিন, স্টাফ ও কাস্টমারদের জন্য পৃথক পারমিশন
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Already Logged In */}
        {currentUser ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">লগইন ব্যবহারকারী:</span>
                <span className="font-bold text-white text-sm">{currentUser.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ভূমিকা / রোল:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] uppercase ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : currentUser.role === 'staff'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'দোকান মালিক (Admin)' : currentUser.role === 'staff' ? 'কাউন্টার স্টাফ' : 'গ্রাহক (Customer)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">মোবাইল:</span>
                <span className="font-mono text-slate-300">{currentUser.phone}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] text-slate-400 font-medium">রোল পরিবর্তন করতে ডেমো সুইচ করুন:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => quickLoginAs('admin')}
                  className={`py-2 rounded-xl font-bold text-xs transition-colors border ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800'
                  }`}
                >
                  👑 অ্যাডমিন
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('staff')}
                  className={`py-2 rounded-xl font-bold text-xs transition-colors border ${
                    currentUser.role === 'staff'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800'
                  }`}
                >
                  💼 স্টাফ
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('customer')}
                  className={`py-2 rounded-xl font-bold text-xs transition-colors border ${
                    currentUser.role === 'customer'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800'
                  }`}
                >
                  🛒 কাস্টমার
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 rounded-xl font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
              >
                লগআউট করুন
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        ) : (
          /* Login / Signup Forms */
          <div className="space-y-4 text-xs">
            {/* Quick Demo Login Pills */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                ⚡ দ্রুত এক-ক্লিক ডেমো লগইন:
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => quickLoginAs('admin')}
                  className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 font-semibold text-[11px]"
                >
                  👑 অ্যাডমিন
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('staff')}
                  className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 font-semibold text-[11px]"
                >
                  💼 স্টাফ
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('customer')}
                  className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px]"
                >
                  🛒 কাস্টমার
                </button>
              </div>
            </div>

            {/* Mode switch */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                  mode === 'login' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400'
                }`}
              >
                লগইন (Sign In)
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                  mode === 'signup' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400'
                }`}
              >
                নতুন সাইন-আপ (Sign Up)
              </button>
            </div>

            {/* Login Form */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    মোবাইল নম্বর অথবা ইমেইল *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX বা admin@dulalmotors.com"
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    পাসওয়ার্ড *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="পাসওয়ার্ড লিখুন"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">
                    ডেমো পাসওয়ার্ড: admin (অ্যাডমিন), staff (স্টাফ), user (কাস্টমার)
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                >
                  প্রবেশ করুন (Login)
                </button>
              </form>
            ) : (
              /* Signup Form */
              <form onSubmit={handleSignupSubmit} className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    আপনার নাম *
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
                    অ্যাকাউন্টের ভূমিকা (Role) *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['customer', 'staff', 'admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-1.5 rounded-lg font-bold border transition-colors ${
                          role === r
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {r === 'admin' ? 'মালিক' : r === 'staff' ? 'স্টাফ' : 'কাস্টমার'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    পাসওয়ার্ড তৈরি করুন *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="কমপক্ষে ৪ সংখ্যার পাসওয়ার্ড"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                >
                  অ্যাকাউন্ট নিবন্ধন করুন
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
