import React, { useState } from 'react';
import { Sale, ShopSettings } from '../types/pos';
import { formatMoney, formatDateTime, toBanglaNumber } from '../utils/formatters';
import { Printer, X, Share2, Check, Download, FileText } from 'lucide-react';

interface InvoiceModalProps {
  sale: Sale | null;
  settings: ShopSettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, settings, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'thermal' | 'a4'>('thermal');

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const generateShareText = () => {
    const lines = [
      `🧾 *${settings.shopNameBn}* (${settings.shopName})`,
      `📍 ${settings.address}`,
      `📞 ${settings.phone1}`,
      `--------------------------------`,
      `ইনভয়েস: ${sale.invoiceNo}`,
      `তারিখ: ${formatDateTime(sale.saleDate)}`,
      `গ্রাহক: ${sale.customerName || 'সাধারণ খদ্দের'}`,
      `--------------------------------`,
      ...sale.items.map(
        (it, idx) =>
          `${idx + 1}. ${it.productName} x ${it.qty} ${it.unit} = ${formatMoney(it.lineTotal, settings.currencySymbol)}`
      ),
      `--------------------------------`,
      `মোট বিল: ${formatMoney(sale.subtotal, settings.currencySymbol)}`,
      sale.discount > 0 ? `ডিসকাউন্ট: -${formatMoney(sale.discount, settings.currencySymbol)}` : '',
      `সর্বমোট দেয়: ${formatMoney(sale.total, settings.currencySymbol)}`,
      `জমা: ${formatMoney(sale.paid, settings.currencySymbol)} (${sale.paymentMethod})`,
      sale.due > 0 ? `বকেয়া: ${formatMoney(sale.due, settings.currencySymbol)}` : '',
      sale.totalCustomerDue !== undefined && sale.totalCustomerDue > 0
        ? `পূর্বের মোট বকেয়াসহ: ${formatMoney(sale.totalCustomerDue, settings.currencySymbol)}`
        : '',
      `--------------------------------`,
      `ধন্যবাদ! আবার আসবেন।`,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleCopyWhatsApp = () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-white text-base">বিক্রয় ইনভয়েস / Memo</h3>
              <p className="text-xs text-slate-400 font-mono">{sale.invoiceNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setInvoiceType('thermal')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  invoiceType === 'thermal'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                থার্মাল রিসিট (POS)
              </button>
              <button
                onClick={() => setInvoiceType('a4')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  invoiceType === 'a4'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                পূর্ণাঙ্গ মেমো (A4/A5)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex justify-center">
          {/* Printable Invoice Container */}
          <div
            id="printable-receipt"
            className={`bg-white text-slate-900 shadow-xl transition-all duration-200 ${
              invoiceType === 'thermal'
                ? 'w-full max-w-[380px] p-4 text-[13px] leading-relaxed rounded-lg border border-slate-200'
                : 'w-full max-w-[560px] p-6 text-[14px] leading-relaxed rounded-lg border border-slate-200'
            }`}
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h1 className="text-xl font-bold tracking-tight text-slate-950">{settings.shopNameBn}</h1>
              <div className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                {settings.shopName}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">{settings.tagline}</p>
              <p className="text-[11px] text-slate-600 font-medium">প্রোঃ {settings.proprietor}</p>
              <p className="text-[11px] text-slate-600">{settings.address}</p>
              <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                মোবাইল: {settings.phone1} {settings.phone2 ? `, ${settings.phone2}` : ''}
              </p>
            </div>

            {/* Invoice Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">ইনভয়েস নং:</span>
                <span className="font-mono font-bold text-slate-900">{sale.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">তারিখ ও সময়:</span>
                <span className="text-slate-800">{formatDateTime(sale.saleDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">গ্রাহক:</span>
                <span className="font-semibold text-slate-900">
                  {sale.customerName || 'সাধারণ খদ্দের (Walk-in)'}
                </span>
              </div>
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">মোবাইল:</span>
                  <span className="text-slate-800 font-mono">{sale.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-300 text-[11px] text-slate-500 font-semibold uppercase">
                    <th className="pb-1">বিবরণ / Item</th>
                    <th className="pb-1 text-center">পরিমাণ</th>
                    <th className="pb-1 text-right">দর</th>
                    <th className="pb-1 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {sale.items.map((item, index) => (
                    <tr key={index} className="py-1">
                      <td className="py-1.5 pr-2 font-medium text-slate-800">
                        {item.productName}
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono whitespace-nowrap text-slate-600">
                        {item.qty} {item.unit}
                      </td>
                      <td className="py-1.5 px-1 text-right font-mono text-slate-600">
                        {item.unitPrice}
                      </td>
                      <td className="py-1.5 pl-1 text-right font-mono font-semibold text-slate-900">
                        {item.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>মোট আইটেম মূল্য (Subtotal):</span>
                <span className="font-mono font-medium">{formatMoney(sale.subtotal, settings.currencySymbol)}</span>
              </div>

              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>ডিসকাউন্ট (Discount):</span>
                  <span className="font-mono">-{formatMoney(sale.discount, settings.currencySymbol)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-950 text-sm pt-1 border-t border-slate-200">
                <span>সর্বমোট বিল (Net Total):</span>
                <span className="font-mono">{formatMoney(sale.total, settings.currencySymbol)}</span>
              </div>

              <div className="flex justify-between text-slate-700 pt-0.5">
                <span>
                  জমা ({sale.paymentMethod}):
                </span>
                <span className="font-mono font-semibold text-emerald-700">
                  {formatMoney(sale.paid, settings.currencySymbol)}
                </span>
              </div>

              {sale.due > 0 && (
                <div className="flex justify-between text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded">
                  <span>বর্তমান বকেয়া (Current Due):</span>
                  <span className="font-mono">{formatMoney(sale.due, settings.currencySymbol)}</span>
                </div>
              )}

              {sale.previousDue !== undefined && sale.previousDue > 0 && (
                <div className="flex justify-between text-slate-600 pt-1 text-[11px]">
                  <span>পূর্বের অবশিষ্ট বকেয়া:</span>
                  <span className="font-mono">{formatMoney(sale.previousDue, settings.currencySymbol)}</span>
                </div>
              )}

              {sale.totalCustomerDue !== undefined && sale.totalCustomerDue > 0 && (
                <div className="flex justify-between text-amber-900 font-bold bg-amber-50 px-2 py-1 rounded text-xs mt-1 border border-amber-200">
                  <span>মোট মোট বকেয়া (Grand Total Due):</span>
                  <span className="font-mono">{formatMoney(sale.totalCustomerDue, settings.currencySymbol)}</span>
                </div>
              )}
            </div>

            {/* Note if any */}
            {sale.note && (
              <div className="p-2 my-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">নোট:</span> {sale.note}
              </div>
            )}

            {/* Barcode Mock Visual */}
            <div className="my-3 text-center">
              <div className="inline-flex items-center gap-[2px] h-9 px-3 bg-slate-50 border border-slate-200 rounded">
                {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6].map((w, i) => (
                  <div
                    key={i}
                    className="h-full bg-slate-800"
                    style={{ width: `${(w % 3) + 1.2}px` }}
                  />
                ))}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">{sale.invoiceNo}</div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-1">
              <p className="font-medium">{settings.invoiceFooterNote}</p>
              <p className="text-[9px] text-slate-400">Software: Dulal Motors Smart POS System</p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer (Hidden during print) */}
        <div className="no-print flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900">
          <div className="text-xs text-slate-400">
            প্রিন্ট করতে <strong>Print</strong> বাটনে ক্লিক করুন বা কাস্টমারকে শেয়ার করুন।
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors"
              title="Copy SMS/WhatsApp bill summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'মেসেজ কপি হয়েছে!' : 'হোয়াটসঅ্যাপ / SMS'}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              প্রিন্ট রিসিট (Print)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
