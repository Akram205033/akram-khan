export function formatMoney(amount: number | string | undefined | null, symbol = '৳'): string {
  const val = Number(amount) || 0;
  return `${symbol} ${val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatQty(qty: number | undefined | null, unit = 'পিস'): string {
  const val = Number(qty) || 0;
  return `${val.toLocaleString('en-IN')} ${unit}`;
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateOnly(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function generateInvoiceNumber(prefix: string, count: number): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}-${dateStr}-${seq}`;
}

const banglaDigits: { [key: string]: string } = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBanglaNumber(input: number | string): string {
  return String(input).replace(/[0-9]/g, (match) => banglaDigits[match] || match);
}

export function generateCollectionReceiptSms(
  customerName: string,
  amount: number,
  remainingDue: number,
  voucherNo: string,
  shopName: string = 'দুলাল মোটরস'
): string {
  return `শ্রদ্ধেয় গ্রাহক ${customerName}, ${shopName}-এ ভাউচার নং #${voucherNo} এর মাধ্যমে ${formatMoney(amount)} জমা হয়েছে। আপনার বর্তমান অবশিষ্ট বকেয়া: ${formatMoney(remainingDue)}। ধন্যবাদ।`;
}
