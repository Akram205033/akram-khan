import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import {
  Product,
  Customer,
  Supplier,
  Sale,
  Purchase,
  Collection,
  Expense,
  ShopSettings,
  Staff,
} from '../types/pos';
import { formatMoney } from '../utils/formatters';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  X,
  Compass,
} from 'lucide-react';

interface AiPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  collections: Collection[];
  expenses: Expense[];
  staff: Staff[];
  settings: ShopSettings;
  cashBalance: number;
  totalMarketDue: number;
  totalSupplierDue: number;
  onNavigate: (page: any) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  action?: { label: string; page: string };
}

export const AiPartnerModal: React.FC<AiPartnerModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  suppliers,
  sales,
  purchases,
  collections,
  expenses,
  staff,
  settings,
  cashBalance,
  totalMarketDue,
  totalSupplierDue,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `আসসালামু আলাইকুম! আমি দুলাল মোটরস-এর স্মার্ট এআই পার্টনার ও ডেভলপমেন্ট সঙ্গী। আপনি আমাকে সরাসরি প্রশ্ন করতে পারেন বা নিচে মাইক চিহ্নে চাপ দিয়ে ভয়েস কমান্ড দিতে পারেন। ব্যবসার সার্বিক অবস্থা পর্যবেক্ষণ, নতুন আইডিয়া বা যেকোনো কাজের ধাপে ধাপে নির্দেশনার জন্য আমি সবসময় প্রস্তুত!`,
      time: 'এখন',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'bn-BD'; // Default Bengali, also understands mixed

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('আপনার ব্রাউজারে ভয়েস রিকগনিশন সাপোর্ট নেই। অনুগ্রহ করে Chrome ব্যবহার করুন।');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
      }
    }
  };

  // Text-to-speech speak
  const speakText = (text: string) => {
    if (!isSpeakingEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'bn-BD';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  // Quick Action questions
  const quickQuestions = [
    'আজকের ব্যবসার অবস্থা কেমন?',
    'কোন পার্টসগুলোর স্টক কম?',
    'বাকি আদায়ের সেরা কৌশল কী?',
    'ব্যবসার লাভ বাড়ানোর আইডিয়া দাও',
    'কাউন্টারে গিয়ে নতুন বিক্রি করো',
  ];

  // Intelligence response generator
  const generateResponse = async (userQuery: string): Promise<{ text: string; action?: { label: string; page: string } }> => {
    const q = userQuery.toLowerCase().trim();

    // Check direct navigation commands
    if (q.includes('কাউন্টার') || q.includes('বিক্রি') || q.includes('pos')) {
      return {
        text: 'আপনাকে সেলস কাউন্টারে নিয়ে যাচ্ছি। এখান থেকে দ্রুত বারকোড বা নাম দিয়ে পণ্য কার্টে নিয়ে ক্যাশ/বাকি মেমো তৈরি করতে পারেন।',
        action: { label: 'সেলস কাউন্টারে যান →', page: 'pos' },
      };
    }

    if (q.includes('স্টক') || q.includes('পণ্য') || q.includes('মজুত') || q.includes('ইনভেন্টরি')) {
      const low = products.filter((p) => p.stock <= p.minStock);
      if (q.includes('কম') || q.includes('ঘাটতি')) {
        return {
          text: `বর্তমানে ${low.length} টি পণ্যের স্টক নির্ধারিত সীমার চেয়ে কম রয়েছে: ${low
            .slice(0, 3)
            .map((p) => `${p.name} (${p.stock} ${p.unit})`)
            .join(', ')}। এখনই মহাজনদের কাছে অর্ডার দেওয়া প্রয়োজন।`,
          action: { label: 'পণ্য ও স্টক তালিকা দেখুন →', page: 'products' },
        };
      }
      return {
        text: `দোকানে বর্তমানে মোট ${products.length} প্রকার পণ্য ও মোট ${products.reduce((s, p) => s + p.stock, 0)} ইউনিট স্টক মজুত রয়েছে। স্টকের মোট ক্রয়মূল্য ${formatMoney(products.reduce((s, p) => s + p.stock * p.purchasePrice, 0), settings.currencySymbol)}।`,
        action: { label: 'ইনভেন্টরি দেখুন →', page: 'products' },
      };
    }

    if (q.includes('বাকি') || q.includes('কালেকশন') || q.includes('পাওনা')) {
      return {
        text: `মার্কেটে কাস্টমারদের কাছে আপনার মোট বাকি রয়েছে ${formatMoney(totalMarketDue, settings.currencySymbol)}। বাকি আদায়ে নিয়মিত কাস্টমারদের সাথে যোগাযোগ করুন এবং রসিদ মেসেজ পাঠান।`,
        action: { label: 'বাকি আদায় মডিউলে যান →', page: 'collection' },
      };
    }

    if (q.includes('লাভ') || q.includes('লাভ-ক্ষতি') || q.includes('রিপোর্ট') || q.includes('আয়')) {
      const todaySales = sales.filter((s) => s.saleDate.startsWith(new Date().toISOString().split('T')[0]));
      const todayTotal = todaySales.reduce((s, x) => s + x.total, 0);
      return {
        text: `আজকে মোট বিক্রি হয়েছে ${formatMoney(todayTotal, settings.currencySymbol)} (${todaySales.length} টি ইনভয়েস)। বিস্তারিত প্রফিট ও মার্জিন দেখার জন্য রিপোর্ট পেজ দেখুন।`,
        action: { label: 'ব্যবসায়িক রিপোর্ট দেখুন →', page: 'reports' },
      };
    }

    if (q.includes('স্টাফ') || q.includes('বেতন') || q.includes('হাজিরা') || q.includes('কর্মচারী')) {
      return {
        text: `দোকানে মোট ${staff.length} জন কর্মচারী নিয়োজিত রয়েছেন। আপনি দৈনিক হাজিরা পঞ্চ করতে পারেন এবং মাস শেষে অগ্রিম কর্তনসহ বেতন স্লিপ তৈরি করতে পারেন।`,
        action: { label: 'স্টাফ হাজিরা ও বেতন পেজ →', page: 'staff' },
      };
    }

    if (q.includes('ফেরত') || q.includes('রিটার্ন')) {
      return {
        text: 'বিক্রিত মাল ফেরত নিতে সেলস হিস্ট্রি পেজে গিয়ে সংশ্লিষ্ট ইনভয়েসের পাশে "ফেরত" বাটনে ক্লিক করুন। পণ্য স্বয়ংক্রিয়ভাবে স্টকে জমা হবে এবং ক্যাশ বা বাকি সমন্বয় হবে।',
        action: { label: 'সেলস হিস্ট্রি ও রিটার্ন পেজ →', page: 'salesHistory' },
      };
    }

    // Try Gemini API if available in environment
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are Dulal AI Copilot (দুলাল এআই পার্টনার), the trusted AI business partner and development companion for "Dulal Motors" (দুলাল মোটরস), a tractor and motor spare parts shop in Rangpur, Bangladesh.
Proprietor: ${settings.proprietor}.
Current Real-time Data:
- Products in catalog: ${products.length}
- Low Stock Items: ${products.filter((p) => p.stock <= p.minStock).length}
- Cash Balance: ${cashBalance} BDT
- Total Customer Due: ${totalMarketDue} BDT
- Total Supplier Payable: ${totalSupplierDue} BDT
- Staff count: ${staff.length}

User asked in Bengali/English: "${userQuery}".
Provide a concise, encouraging, and highly practical response in natural Bengali (with numbers formatted clearly). Give step-by-step guidance or growth ideas suited for a motor spare parts shop. Keep it under 4 sentences.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (response.text) {
          return { text: response.text.trim() };
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local expert system:', err);
      }
    }

    // Business growth suggestions fallback
    return {
      text: `দুলাল মোটরস-এর ব্যবসার প্রসার ঘটাতে:\n১. মাহিন্দ্রা, সোনালিকা ও পাওয়ার টিলারের ফাস্ট-মুভিং ফিল্টার ও বেল্ট সবসময় পর্যাপ্ত স্টকে রাখুন।\n২. বড় বাকিদারদের বাকি আদায়ের জন্য সরাসরি ফোন ও রসিদ এসএমএস পাঠান।\n৩. নিয়মিত মেকানিকদের সাথে সুসম্পর্ক গড়ে তুলুন এবং ক্যাশ কেনায় বিশেষ সুবিধা দিন।`,
      action: { label: 'ড্যাশবোর্ড পর্যবেক্ষণ করুন →', page: 'dashboard' },
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsGenerating(true);

    try {
      const response = await generateResponse(query);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: response.action,
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakText(response.text);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'দুঃখিত, উত্তর তৈরিতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার বলুন।',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">দুলাল এআই পার্টনার</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ভয়েস ও ডেভলপমেন্ট সঙ্গী
                </span>
              </div>
              <p className="text-xs text-slate-400">
                স্মার্ট শপ অ্যানালাইটিক্স · ভয়েস কমান্ড · অটোমেটেড গাইডেন্স
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSpeakingEnabled((prev) => !prev)}
              className={`p-2 rounded-xl border transition-colors ${
                isSpeakingEnabled
                  ? 'bg-slate-800 text-amber-400 border-slate-700'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
              title={isSpeakingEnabled ? 'ভয়েস আউটপুট চালু' : 'ভয়েস আউটপুট বন্ধ'}
            >
              {isSpeakingEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Shop Vitals Bar */}
        <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 text-[11px]">
          <div>
            <span className="text-slate-500 block">ক্যাশ ব্যালেন্স:</span>
            <span className="font-mono font-bold text-cyan-400">
              {formatMoney(cashBalance, settings.currencySymbol)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">মার্কেট বাকি:</span>
            <span className="font-mono font-bold text-rose-400">
              {formatMoney(totalMarketDue, settings.currencySymbol)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">পণ্য সংখ্যা:</span>
            <span className="font-mono font-bold text-white">{products.length} টি</span>
          </div>
          <div>
            <span className="text-slate-500 block">স্টাফ সংখ্যা:</span>
            <span className="font-mono font-bold text-indigo-400">{staff.length} জন</span>
          </div>
        </div>

        {/* Chat Message Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-950/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none shadow-md'
                }`}
              >
                {m.sender === 'ai' && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>DU-LAL COPILOT</span>
                  </div>
                )}
                <div className="whitespace-pre-line">{m.text}</div>

                {/* Optional Action Button */}
                {m.action && (
                  <button
                    onClick={() => {
                      onNavigate(m.action?.page);
                      onClose();
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all"
                  >
                    <span>{m.action.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
            </div>
          ))}

          {isGenerating && (
            <div className="flex items-center gap-2 text-xs text-amber-400 p-2 rounded-xl bg-slate-900/60 w-fit">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>এআই ভাবছে এবং বিশ্লেষণ করছে...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 whitespace-nowrap flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            পরামর্শ:
          </span>
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
          {/* Voice Input Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-xl transition-all flex items-center justify-center ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
            }`}
            title={isListening ? 'ভয়েস ইনপুট বন্ধ করুন' : 'মাইক চালু করে বাংলায় কথা বলুন'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={
              isListening ? 'শুনছি... আপনার প্রশ্ন বা কমান্ড বলুন...' : 'প্রশ্ন লিখুন অথবা মাইকে কথা বলুন...'
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 placeholder-slate-500"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim()}
            className="p-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 transition-all font-bold"
            title="মেসেজ পাঠান"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
