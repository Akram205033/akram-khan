export type ProductCategory = 
  | 'Bearing' 
  | 'Tractor Parts' 
  | 'Engine Parts' 
  | 'Tyre' 
  | 'Lubricant' 
  | 'Electrical' 
  | 'Brake & Clutch'
  | 'Hardware & Other';

export type ProductUnit = 'পিস' | 'সেট' | 'জোড়া' | 'লিটার' | 'কেজি' | 'মিটার' | 'প্যাকেট';

export interface Product {
  id: number;
  sku: string;
  name: string;
  banglaName?: string;
  category: ProductCategory;
  unit: ProductUnit;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  location?: string;
  description?: string;
  compatibleVehicles?: string[]; // e.g. ["Mahindra 575", "Sonalika 60"]
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  vehicleType?: string;
  createdAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  company: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  lineTotal: number;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  productName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  costPrice: number;
  lineTotal: number;
}

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Due' | 'Credit_Adjustment';

export interface Sale {
  id: number;
  invoiceNo: string;
  customerId: number | null;
  customerName?: string;
  customerPhone?: string;
  saleDate: string;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  paymentMethod: PaymentMethod;
  note?: string;
  items: SaleItem[];
  previousDue?: number;
  totalCustomerDue?: number;
  hasReturns?: boolean;
}

export interface SaleReturnItem {
  productId: number;
  productName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  refundAmount: number;
}

export interface SaleReturn {
  id: number;
  returnNo: string;
  saleId: number;
  invoiceNo: string;
  customerId: number | null;
  customerName?: string;
  returnDate: string;
  items: SaleReturnItem[];
  totalRefund: number;
  refundMethod: 'Cash' | 'Credit_Adjustment' | 'bKash';
  reason: string;
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number;
  productName: string;
  qty: number;
  unit: string;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
  id: number;
  purchaseNo: string;
  supplierId: number | null;
  supplierName?: string;
  purchaseDate: string;
  total: number;
  paid: number;
  due: number;
  paymentMethod: PaymentMethod;
  note?: string;
  items: PurchaseItem[];
}

export interface Collection {
  id: number;
  customerId: number;
  customerName?: string;
  amount: number;
  collectionDate: string;
  method: PaymentMethod;
  note?: string;
  voucherNo?: string;
}

export type ExpenseCategory = 
  | 'দোকান ভাড়া' 
  | 'বিদ্যুৎ ও ওয়াইফাই বিল' 
  | 'কর্মচারী বেতন' 
  | 'পরিবহন ও যাতায়াত' 
  | 'চা-নাস্তা ও আপ্যায়ন' 
  | 'মেরামত ও রক্ষণাবেক্ষণ' 
  | 'প্যাকিং ও স্টেশনারি'
  | 'অন্যান্য খরচ';

export interface Expense {
  id: number;
  expenseDate: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface CashTransaction {
  id: number;
  txDate: string;
  txType: 'IN' | 'OUT';
  source: 'Sale' | 'Collection' | 'Purchase' | 'Expense' | 'Return_Refund' | 'Staff_Salary' | 'Manual_IN' | 'Manual_OUT' | 'Opening_Balance';
  reference: string;
  amount: number;
  note?: string;
}

export interface StockAdjustment {
  id: number;
  productId: number;
  productName: string;
  prevStock: number;
  adjustmentQty: number;
  newStock: number;
  reason: string;
  date: string;
}

export interface Staff {
  id: number;
  name: string;
  role: string;
  phone: string;
  nid?: string;
  monthlySalary: number;
  joinDate: string;
  status: 'active' | 'inactive';
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface StaffAttendance {
  id: number;
  staffId: number;
  staffName: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}

export interface StaffSalaryPayment {
  id: number;
  staffId: number;
  staffName: string;
  month: string;
  baseSalary: number;
  presentDays: number;
  absentDays: number;
  advanceDeduction: number;
  bonus: number;
  netPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  voucherNo: string;
  note?: string;
}

export interface ShopSettings {
  shopName: string;
  shopNameBn: string;
  tagline: string;
  proprietor: string;
  phone1: string;
  phone2: string;
  address: string;
  invoiceFooterNote: string;
  currencySymbol: string;
  language: 'bn' | 'en';
  openingCash: number;
}

// User & Role-Based Access Control (RBAC)
export type UserRole = 'admin' | 'staff' | 'customer';

export interface AppUser {
  id: number;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role: UserRole;
  staffId?: number;
  customerId?: number;
  createdAt: string;
}

// Customer Online Order System
export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'delivered' | 'cancelled';
export type OrderPaymentPreference = 'Cash_on_Delivery' | 'bKash' | 'Store_Pickup';

export interface CustomerOrderItem {
  productId: number;
  productName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface CustomerOrder {
  id: number;
  orderNo: string;
  customerId?: number | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  vehicleModel?: string;
  orderDate: string;
  status: OrderStatus;
  items: CustomerOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentPreference: OrderPaymentPreference;
  notes?: string;
  convertedSaleInvoice?: string;
}
