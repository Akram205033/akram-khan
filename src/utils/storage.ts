import {
  Product,
  Customer,
  Supplier,
  Sale,
  SaleReturn,
  Purchase,
  Collection,
  Expense,
  CashTransaction,
  StockAdjustment,
  ShopSettings,
  Staff,
  StaffAttendance,
  StaffSalaryPayment,
  AppUser,
  CustomerOrder,
} from '../types/pos';

const STORAGE_KEYS = {
  PRODUCTS: 'dulal_pos_products_v3',
  CUSTOMERS: 'dulal_pos_customers_v3',
  SUPPLIERS: 'dulal_pos_suppliers_v3',
  SALES: 'dulal_pos_sales_v3',
  RETURNS: 'dulal_pos_returns_v3',
  PURCHASES: 'dulal_pos_purchases_v3',
  COLLECTIONS: 'dulal_pos_collections_v3',
  EXPENSES: 'dulal_pos_expenses_v3',
  CASH_TX: 'dulal_pos_cash_tx_v3',
  STOCK_ADJUSTMENTS: 'dulal_pos_stock_adj_v3',
  SETTINGS: 'dulal_pos_settings_v3',
  STAFF: 'dulal_pos_staff_v3',
  ATTENDANCE: 'dulal_pos_attendance_v3',
  SALARY_PAYMENTS: 'dulal_pos_salary_payments_v3',
  USERS: 'dulal_pos_users_v3',
  CURRENT_USER: 'dulal_pos_curr_user_v3',
  CUSTOMER_ORDERS: 'dulal_pos_cust_orders_v3',
};

export const defaultSettings: ShopSettings = {
  shopName: 'DULAL MOTORS',
  shopNameBn: 'দুলাল মোটরস',
  tagline: 'ট্র্যাক্টর, ট্রলি ও ইঞ্জিন পার্টস পাইকারি ও খুচরা বিক্রেতা',
  proprietor: 'মোঃ দুলাল হোসেন',
  phone1: '01712-345678',
  phone2: '01819-876543',
  address: 'ট্র্যাক্টর মার্কেট, মেইন রোড, রংপুর',
  invoiceFooterNote: 'বিক্রিত মাল ফেরত নেওয়া হয় না। তবে অক্ষত থাকলে পরিবর্তনযোগ্য। আমাদের সাথে থাকার জন্য ধন্যবাদ!',
  currencySymbol: '৳',
  language: 'bn',
  openingCash: 15000,
};

export const initialProducts: Product[] = [
  {
    id: 1,
    sku: 'BRG-6205',
    name: 'SKF Deep Groove Ball Bearing 6205-2RS',
    banglaName: 'এসকেএফ বল বিয়ারিং ৬২০৫',
    category: 'Bearing',
    unit: 'পিস',
    purchasePrice: 280,
    sellingPrice: 380,
    stock: 17,
    minStock: 5,
    location: 'Rack A-1',
    description: 'উচ্চমানের অরিজিনাল SKF রাবার সিল্ড ডিপ গ্রুভ বল বিয়ারিং। দীর্ঘস্থায়ী ও মসৃণ কার্যক্ষমতা।',
    compatibleVehicles: ['Mahindra 575 DI', 'Sonalika 60', 'Power Tiller', 'Shaktiman Rotavator'],
    createdAt: '2026-10-15T09:00:00Z',
  },
  {
    id: 2,
    sku: 'BRG-6308',
    name: 'SKF Heavy Roller Bearing 6308',
    banglaName: 'এসকেএফ রোলার বিয়ারিং ৬৩০৮',
    category: 'Bearing',
    unit: 'পিস',
    purchasePrice: 620,
    sellingPrice: 820,
    stock: 11,
    minStock: 4,
    location: 'Rack A-2',
    description: 'হেভি ডিউটি ট্র্যাক্টর গিয়ারবক্স ও এক্সেল বিয়ারিং। অতিরিক্ত লোড সহ্য করতে সক্ষম।',
    compatibleVehicles: ['TAFE 241', 'Mahindra 575 DI', 'Sonalika 50'],
    createdAt: '2026-10-15T09:10:00Z',
  },
  {
    id: 3,
    sku: 'MH-PST-575',
    name: 'Mahindra 575 DI Piston & Sleeve Kit (Goetze)',
    banglaName: 'মাহিন্দ্রা ৫৭৫ ডিআই পিস্টন ও স্লিভ কিট',
    category: 'Engine Parts',
    unit: 'সেট',
    purchasePrice: 5800,
    sellingPrice: 7200,
    stock: 1,
    minStock: 2,
    location: 'Shelf B-3',
    description: 'জার্মান প্রযুক্তির গয়েটজে অরিজিনাল পিস্টন, রিং ও লাইনার সম্পূর্ণ ইঞ্জিন ওভারহোলিং কিট।',
    compatibleVehicles: ['Mahindra 575 DI', 'Mahindra 475 DI'],
    createdAt: '2026-10-16T10:00:00Z',
  },
  {
    id: 4,
    sku: 'SN-FLT-60',
    name: 'Sonalika Fuel Filter Assembly Original',
    banglaName: 'সোনালিকা ডিজেল ফিল্টার অ্যাসেম্বলি',
    category: 'Tractor Parts',
    unit: 'পিস',
    purchasePrice: 420,
    sellingPrice: 580,
    stock: 17,
    minStock: 6,
    location: 'Shelf C-1',
    description: 'সোনালিকা ট্র্যাক্টরের জন্য অরিজিনাল জ্বালানি ফিল্টার। ডিজেলের ময়লা ও পানি শতভাগ পরিষ্কার রাখে।',
    compatibleVehicles: ['Sonalika 60 RX', 'Sonalika 50', 'Sonalika 35'],
    createdAt: '2026-10-17T11:00:00Z',
  },
  {
    id: 5,
    sku: 'OIL-MBL-20W50',
    name: 'Mobil Super 1000 20W-50 4L Can',
    banglaName: 'মবিল সুপার ২০W-৫০ ইঞ্জিন অয়েল ৪ লিটার',
    category: 'Lubricant',
    unit: 'পিস',
    purchasePrice: 1950,
    sellingPrice: 2350,
    stock: 15,
    minStock: 5,
    location: 'Oil Bay 1',
    description: 'অরিজিনাল মবিল সুপার ১০০০ ট্র্যাক্টর ও ডিজেল ইঞ্জিনের জন্য সেরা সুরক্ষা প্রদানকারী প্রিমিয়াম ইঞ্জিন অয়েল।',
    compatibleVehicles: ['All Tractors', 'Trucks', 'Generators'],
    createdAt: '2026-10-18T10:30:00Z',
  },
  {
    id: 6,
    sku: 'TYR-APL-60016',
    name: 'Apollo Tractor Front Tyre 6.00-16 Krishichakra',
    banglaName: 'অ্যাপোলো ট্র্যাক্টর সামনের টায়ার ৬.০০-১৬',
    category: 'Tyre',
    unit: 'পিস',
    purchasePrice: 4800,
    sellingPrice: 5600,
    stock: 6,
    minStock: 2,
    location: 'Tyre Rack 1',
    description: 'কাদামাটি ও কাঁচা রাস্তায় মজবুত গ্রিপ সম্পন্ন ৮ প্লাই রেটিং যুক্ত দীর্ঘস্থায়ী টায়ার।',
    compatibleVehicles: ['Mahindra 575', 'Sonalika 60', 'TAFE 241', 'Farmtrac'],
    createdAt: '2026-10-19T14:00:00Z',
  },
  {
    id: 7,
    sku: 'CLT-TFE-11',
    name: 'TAFE / Massey Ferguson Clutch Plate 11 inch',
    banglaName: 'মেসি ফার্গুসন ক্লাচ প্লেট ১১ ইঞ্চি',
    category: 'Brake & Clutch',
    unit: 'পিস',
    purchasePrice: 2200,
    sellingPrice: 2950,
    stock: 7,
    minStock: 3,
    location: 'Shelf B-1',
    description: 'সিরামিক মেটালিক বাটন যুক্ত হেভি ডিউটি ক্লাচ প্লেট। স্লিপ করে না ও দ্রুত পিকআপ দেয়।',
    compatibleVehicles: ['TAFE 241 DI', 'Massey Ferguson 1035'],
    createdAt: '2026-10-20T12:00:00Z',
  },
  {
    id: 8,
    sku: 'BAT-EXD-75',
    name: 'Exide Heavy Duty Tractor Battery 12V 75Ah',
    banglaName: 'এক্সাইড হেভি ডিউটি ব্যাটারি ৭৫ এম্পিয়ার',
    category: 'Electrical',
    unit: 'পিস',
    purchasePrice: 8400,
    sellingPrice: 9900,
    stock: 3,
    minStock: 2,
    location: 'Battery Stand',
    description: '১৮ মাসের অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টিসহ অরিজিনাল এক্সাইড ট্র্যাক্টর ব্যাটারি। এক সেলফে স্টার্ট।',
    compatibleVehicles: ['All Tractors', 'Harvester', 'Diesel Engines'],
    createdAt: '2026-10-21T15:00:00Z',
  },
  {
    id: 9,
    sku: 'VBLT-B48',
    name: 'Fenner Industrial V-Belt B-48',
    banglaName: 'ফেনার ভি-বেল্ট বি-৪৮ (ফ্যান বেল্ট)',
    category: 'Hardware & Other',
    unit: 'পিস',
    purchasePrice: 170,
    sellingPrice: 260,
    stock: 2,
    minStock: 5,
    location: 'Hanger Belt A',
    description: 'অয়েল ও হিট রেজিসট্যান্ট শক্তিশালী সিন্থেটিক কর্ড ফ্যান ও অল্টারনেটর বেল্ট।',
    compatibleVehicles: ['Power Tiller', 'Mahindra', 'Water Pump'],
    createdAt: '2026-10-22T08:30:00Z',
  },
  {
    id: 10,
    sku: 'BRK-SH-T407',
    name: 'Tata 407 Brake Shoe Kit Front/Rear',
    banglaName: 'টাটা ৪০৭ ব্রেক শু কিট',
    category: 'Brake & Clutch',
    unit: 'সেট',
    purchasePrice: 1350,
    sellingPrice: 1850,
    stock: 5,
    minStock: 2,
    location: 'Shelf D-2',
    description: 'এসবেস্টস মুক্ত উচ্চমানের ঘর্ষণ প্যাডযুক্ত শক্তিশালী ব্রেক শু কিট।',
    compatibleVehicles: ['Tata 407', 'Tata 709'],
    createdAt: '2026-10-22T09:00:00Z',
  },
  {
    id: 11,
    sku: 'LUB-GRS-5KG',
    name: 'BPW High Temperature Chassis Grease 5KG',
    banglaName: 'হাই টেম্পারেচার চ্যাসিস গ্রিজ ৫ কেজি',
    category: 'Lubricant',
    unit: 'প্যাকেট',
    purchasePrice: 1150,
    sellingPrice: 1450,
    stock: 8,
    minStock: 3,
    location: 'Oil Bay 2',
    description: 'উচ্চ তাপমাত্রা ও পানিরোধী বিশেষ লিথিয়াম বেসড গ্রিজ। চাকা ও ট্রলির জন্য আদর্শ।',
    compatibleVehicles: ['Tractor Trolley', 'Wheel Hubs', 'Bearings'],
    createdAt: '2026-10-23T11:00:00Z',
  },
  {
    id: 12,
    sku: 'ELC-ALT-12V',
    name: 'Lucas-TVS 12V 45A Alternator Assembly',
    banglaName: 'লুকাস অল্টারনেটর ১২ ভোল্ট ৪৫ এম্পিয়ার',
    category: 'Electrical',
    unit: 'পিস',
    purchasePrice: 4200,
    sellingPrice: 5300,
    stock: 1,
    minStock: 2,
    location: 'Shelf E-1',
    description: 'দ্রুত ব্যাটারি চার্জিং সক্ষমতাযুক্ত আসল লুকাস টিভিএস ডায়নামো / অল্টারনেটর।',
    compatibleVehicles: ['Mahindra 575', 'Sonalika 60', 'TAFE 241'],
    createdAt: '2026-10-24T16:00:00Z',
  },
];

export const initialCustomers: Customer[] = [
  {
    id: 1,
    name: 'মোঃ রফিকুল ইসলাম (ড্রাইভার)',
    phone: '01711-223344',
    address: 'পাগলাপীর, রংপুর সদর',
    vehicleType: 'Mahindra 575 DI',
    createdAt: '2026-10-10T10:00:00Z',
  },
  {
    id: 2,
    name: 'হাজী আব্দুল কাদের মাস্টার',
    phone: '01815-998877',
    address: 'গঙ্গাচড়া, রংপুর',
    vehicleType: 'Sonalika 60 RX',
    createdAt: '2026-10-12T11:30:00Z',
  },
  {
    id: 3,
    name: 'আলমগীর অটো ওয়ার্কশপ',
    phone: '01914-556677',
    address: 'মডার্ন মোড়, রংপুর',
    vehicleType: 'Multiple Tractors',
    createdAt: '2026-10-14T14:15:00Z',
  },
  {
    id: 4,
    name: 'মোঃ তারেক রহমান (পাওয়ার টিলার)',
    phone: '01622-334455',
    address: 'কাউনিয়া, রংপুর',
    vehicleType: 'Dongfeng 12HP',
    createdAt: '2026-10-18T16:00:00Z',
  },
];

export const initialSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'এসকেএফ বিয়ারিং ডিস্ট্রিবিউশন',
    company: 'Bengal Bearing & Spares Ltd.',
    phone: '01713-112233',
    address: 'নওয়াবপুর রোড, ঢাকা',
    createdAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 2,
    name: 'রংপুর মোটরস এন্ড পার্টস হাব',
    company: 'North Bengal Machinery Agency',
    phone: '01718-445566',
    address: 'জাহাজ কোম্পানি মোড়, রংপুর',
    createdAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 3,
    name: 'যমুনা লুব্রিকেন্টস ডিলার',
    company: 'Jamuna Oil Agency',
    phone: '01811-778899',
    address: 'রেলওয়ে স্টেশন রোড, রংপুর',
    createdAt: '2026-10-05T11:00:00Z',
  },
];

export const initialSales: Sale[] = [
  {
    id: 1,
    invoiceNo: 'DM-S-20261101-0001',
    customerId: 2,
    customerName: 'হাজী আব্দুল কাদের মাস্টার',
    customerPhone: '01819-334455',
    saleDate: '2026-11-01T11:20:00Z',
    subtotal: 8600,
    discount: 200,
    total: 8400,
    paid: 7000,
    due: 1400,
    paymentMethod: 'Cash',
    note: 'ট্র্যাক্টর টায়ার ও ফিল্টার',
    items: [
      {
        id: 1,
        saleId: 1,
        productId: 6,
        productName: 'Apollo Tractor Front Tyre 6.00-16 Krishichakra',
        qty: 1,
        unit: 'পিস',
        unitPrice: 5600,
        costPrice: 4800,
        lineTotal: 5600,
      },
      {
        id: 2,
        saleId: 1,
        productId: 5,
        productName: 'Mobil Super 1000 20W-50 4L Can',
        qty: 1,
        unit: 'পিস',
        unitPrice: 2350,
        costPrice: 1950,
        lineTotal: 2350,
      },
      {
        id: 3,
        saleId: 1,
        productId: 4,
        productName: 'Sonalika Fuel Filter Assembly Original',
        qty: 1,
        unit: 'পিস',
        unitPrice: 580,
        costPrice: 420,
        lineTotal: 580,
      },
    ],
  },
  {
    id: 2,
    invoiceNo: 'DM-S-20261102-0001',
    customerId: 1,
    customerName: 'মোঃ রফিকুল ইসলাম (ড্রাইভার)',
    customerPhone: '01711-223344',
    saleDate: '2026-11-02T10:30:00Z',
    subtotal: 3170,
    discount: 70,
    total: 3100,
    paid: 2000,
    due: 1100,
    paymentMethod: 'Cash',
    note: 'মাহিন্দ্রা ৫৭৫ এর জন্য জরুরী পার্টস',
    items: [
      {
        id: 4,
        saleId: 2,
        productId: 1,
        productName: 'SKF Deep Groove Ball Bearing 6205-2RS',
        qty: 2,
        unit: 'পিস',
        unitPrice: 380,
        costPrice: 280,
        lineTotal: 760,
      },
      {
        id: 5,
        saleId: 2,
        productId: 5,
        productName: 'Mobil Super 1000 20W-50 4L Can',
        qty: 1,
        unit: 'পিস',
        unitPrice: 2350,
        costPrice: 1950,
        lineTotal: 2350,
      },
    ],
  },
  {
    id: 3,
    invoiceNo: 'DM-S-20261102-0002',
    customerId: 3,
    customerName: 'আলমগীর অটো ওয়ার্কশপ',
    customerPhone: '01914-556677',
    saleDate: '2026-11-02T14:45:00Z',
    subtotal: 5800,
    discount: 200,
    total: 5600,
    paid: 5600,
    due: 0,
    paymentMethod: 'bKash',
    note: 'ক্লাচ প্লেট ও ব্রেক শু সেট',
    items: [
      {
        id: 6,
        saleId: 3,
        productId: 7,
        productName: 'TAFE / Massey Ferguson Clutch Plate 11 inch',
        qty: 1,
        unit: 'পিস',
        unitPrice: 2950,
        costPrice: 2200,
        lineTotal: 2950,
      },
      {
        id: 7,
        saleId: 3,
        productId: 10,
        productName: 'Tata 407 Brake Shoe Kit Front/Rear',
        qty: 1,
        unit: 'সেট',
        unitPrice: 1850,
        costPrice: 1350,
        lineTotal: 1850,
      },
    ],
  },
  {
    id: 4,
    invoiceNo: 'DM-S-20261103-0001',
    customerId: 4,
    customerName: 'মোঃ তারেক রহমান (পাওয়ার টিলার)',
    customerPhone: '01622-334455',
    saleDate: '2026-11-03T09:15:00Z',
    subtotal: 7100,
    discount: 150,
    total: 6950,
    paid: 6000,
    due: 950,
    paymentMethod: 'Cash',
    items: [
      {
        id: 8,
        saleId: 4,
        productId: 12,
        productName: 'Lucas-TVS 12V 45A Alternator Assembly',
        qty: 1,
        unit: 'পিস',
        unitPrice: 5300,
        costPrice: 4200,
        lineTotal: 5300,
      },
      {
        id: 9,
        saleId: 4,
        productId: 2,
        productName: 'SKF Heavy Roller Bearing 6308',
        qty: 2,
        unit: 'পিস',
        unitPrice: 820,
        costPrice: 620,
        lineTotal: 1640,
      },
    ],
  },
  {
    id: 5,
    invoiceNo: 'DM-S-20261104-0001',
    customerId: 1,
    customerName: 'মোঃ রফিকুল ইসলাম (ড্রাইভার)',
    customerPhone: '01711-223344',
    saleDate: '2026-11-04T13:40:00Z',
    subtotal: 12600,
    discount: 200,
    total: 12400,
    paid: 10000,
    due: 2400,
    paymentMethod: 'Cash',
    note: 'পিস্টন কিট ও অল্টারনেটর চালান',
    items: [
      {
        id: 10,
        saleId: 5,
        productId: 3,
        productName: 'Mahindra 575 DI Piston & Sleeve Kit (Goetze)',
        qty: 1,
        unit: 'সেট',
        unitPrice: 7200,
        costPrice: 5800,
        lineTotal: 7200,
      },
      {
        id: 11,
        saleId: 5,
        productId: 12,
        productName: 'Lucas-TVS 12V 45A Alternator Assembly',
        qty: 1,
        unit: 'পিস',
        unitPrice: 5300,
        costPrice: 4200,
        lineTotal: 5300,
      },
    ],
  },
  {
    id: 6,
    invoiceNo: 'DM-S-20261105-0001',
    customerId: 5,
    customerName: 'মেসার্স ভাই ভাই এগ্রো ফার্ম',
    customerPhone: '01735-998877',
    saleDate: '2026-11-05T15:10:00Z',
    subtotal: 10000,
    discount: 200,
    total: 9800,
    paid: 9800,
    due: 0,
    paymentMethod: 'Nagad',
    items: [
      {
        id: 12,
        saleId: 6,
        productId: 8,
        productName: 'Exide Heavy Duty Tractor Battery 12V 75Ah',
        qty: 1,
        unit: 'পিস',
        unitPrice: 9900,
        costPrice: 8400,
        lineTotal: 9900,
      },
    ],
  },
  {
    id: 7,
    invoiceNo: 'DM-S-20261106-0001',
    customerId: 3,
    customerName: 'আলমগীর অটো ওয়ার্কশপ',
    customerPhone: '01914-556677',
    saleDate: '2026-11-06T11:00:00Z',
    subtotal: 14850,
    discount: 350,
    total: 14500,
    paid: 11500,
    due: 3000,
    paymentMethod: 'bKash',
    items: [
      {
        id: 13,
        saleId: 7,
        productId: 8,
        productName: 'Exide Heavy Duty Tractor Battery 12V 75Ah',
        qty: 1,
        unit: 'পিস',
        unitPrice: 9900,
        costPrice: 8400,
        lineTotal: 9900,
      },
      {
        id: 14,
        saleId: 7,
        productId: 6,
        productName: 'Apollo Tractor Front Tyre 6.00-16 Krishichakra',
        qty: 1,
        unit: 'পিস',
        unitPrice: 5600,
        costPrice: 4800,
        lineTotal: 5600,
      },
    ],
  },
  {
    id: 8,
    invoiceNo: 'DM-S-20261107-0001',
    customerId: 2,
    customerName: 'হাজী আব্দুল কাদের মাস্টার',
    customerPhone: '01819-334455',
    saleDate: '2026-11-07T14:30:00Z',
    subtotal: 7300,
    discount: 100,
    total: 7200,
    paid: 7200,
    due: 0,
    paymentMethod: 'Cash',
    items: [
      {
        id: 15,
        saleId: 8,
        productId: 7,
        productName: 'TAFE / Massey Ferguson Clutch Plate 11 inch',
        qty: 2,
        unit: 'পিস',
        unitPrice: 2950,
        costPrice: 2200,
        lineTotal: 5900,
      },
      {
        id: 16,
        saleId: 8,
        productId: 11,
        productName: 'BPW High Temperature Chassis Grease 5KG',
        qty: 1,
        unit: 'প্যাকেট',
        unitPrice: 1450,
        costPrice: 1150,
        lineTotal: 1450,
      },
    ],
  },
  {
    id: 9,
    invoiceNo: 'DM-S-20261108-0001',
    customerId: 4,
    customerName: 'মোঃ তারেক রহমান (পাওয়ার টিলার)',
    customerPhone: '01622-334455',
    saleDate: '2026-11-08T10:45:00Z',
    subtotal: 11500,
    discount: 200,
    total: 11300,
    paid: 9000,
    due: 2300,
    paymentMethod: 'Cash',
    items: [
      {
        id: 17,
        saleId: 9,
        productId: 3,
        productName: 'Mahindra 575 DI Piston & Sleeve Kit (Goetze)',
        qty: 1,
        unit: 'সেট',
        unitPrice: 7200,
        costPrice: 5800,
        lineTotal: 7200,
      },
      {
        id: 18,
        saleId: 9,
        productId: 5,
        productName: 'Mobil Super 1000 20W-50 4L Can',
        qty: 1,
        unit: 'পিস',
        unitPrice: 2350,
        costPrice: 1950,
        lineTotal: 2350,
      },
      {
        id: 19,
        saleId: 9,
        productId: 10,
        productName: 'Tata 407 Brake Shoe Kit Front/Rear',
        qty: 1,
        unit: 'সেট',
        unitPrice: 1850,
        costPrice: 1350,
        lineTotal: 1850,
      },
    ],
  },
  {
    id: 10,
    invoiceNo: 'DM-S-20261109-0001',
    customerId: 1,
    customerName: 'মোঃ রফিকুল ইসলাম (ড্রাইভার)',
    customerPhone: '01711-223344',
    saleDate: '2026-11-09T09:30:00Z',
    subtotal: 9100,
    discount: 200,
    total: 8900,
    paid: 7500,
    due: 1400,
    paymentMethod: 'Cash',
    note: 'আজকের প্রথম সকালের বিক্রি',
    items: [
      {
        id: 20,
        saleId: 10,
        productId: 6,
        productName: 'Apollo Tractor Front Tyre 6.00-16 Krishichakra',
        qty: 1,
        unit: 'পিস',
        unitPrice: 5600,
        costPrice: 4800,
        lineTotal: 5600,
      },
      {
        id: 21,
        saleId: 10,
        productId: 5,
        productName: 'Mobil Super 1000 20W-50 4L Can',
        qty: 1,
        unit: 'পিস',
        unitPrice: 2350,
        costPrice: 1950,
        lineTotal: 2350,
      },
      {
        id: 22,
        saleId: 10,
        productId: 4,
        productName: 'Sonalika Fuel Filter Assembly Original',
        qty: 2,
        unit: 'পিস',
        unitPrice: 580,
        costPrice: 420,
        lineTotal: 1160,
      },
    ],
  },
];

export const initialReturns: SaleReturn[] = [];

export const initialPurchases: Purchase[] = [
  {
    id: 1,
    purchaseNo: 'DM-P-20261028-0001',
    supplierId: 1,
    supplierName: 'এসকেএফ বিয়ারিং ডিস্ট্রিবিউশন',
    purchaseDate: '2026-10-28T11:00:00Z',
    total: 14800,
    paid: 10000,
    due: 4800,
    paymentMethod: 'Cash',
    note: 'মাসিক বিয়ারিং চালান',
    items: [
      {
        id: 1,
        purchaseId: 1,
        productId: 1,
        productName: 'SKF Deep Groove Ball Bearing 6205-2RS',
        qty: 30,
        unit: 'পিস',
        unitCost: 280,
        lineTotal: 8400,
      },
      {
        id: 2,
        purchaseId: 1,
        productId: 2,
        productName: 'SKF Heavy Roller Bearing 6308',
        qty: 10,
        unit: 'পিস',
        unitCost: 640,
        lineTotal: 6400,
      },
    ],
  },
];

export const initialCollections: Collection[] = [
  {
    id: 1,
    customerId: 1,
    customerName: 'মোঃ রফিকুল ইসলাম (ড্রাইভার)',
    amount: 500,
    collectionDate: '2026-11-03T09:30:00Z',
    method: 'Cash',
    voucherNo: 'COL-20261103-01',
    note: 'পূর্বের বকেয়া থেকে আংশিক প্রদান',
  },
];

export const initialExpenses: Expense[] = [
  {
    id: 1,
    expenseDate: '2026-11-01T10:00:00Z',
    category: 'দোকান ভাড়া',
    description: 'নভেম্বর মাসের অগ্রিম দোকান ভাড়া',
    amount: 6000,
    paymentMethod: 'Cash',
  },
  {
    id: 2,
    expenseDate: '2026-11-02T11:00:00Z',
    category: 'কর্মচারী বেতন',
    description: 'কর্মচারী অগ্রিম বেতন প্রদান',
    amount: 5000,
    paymentMethod: 'Cash',
  },
  {
    id: 3,
    expenseDate: '2026-11-03T14:30:00Z',
    category: 'বিদ্যুৎ ও ওয়াইফাই বিল',
    description: 'অক্টোবর মাসের বিদ্যুৎ বিল ও ওয়াইফাই বিল পরিশোধ',
    amount: 1850,
    paymentMethod: 'bKash',
  },
  {
    id: 4,
    expenseDate: '2026-11-04T09:00:00Z',
    category: 'পরিবহন ও যাতায়াত',
    description: 'বগুড়া থেকে পার্টসের চালান আনতে পিকআপ ভাড়া',
    amount: 850,
    paymentMethod: 'Cash',
  },
  {
    id: 5,
    expenseDate: '2026-11-05T16:00:00Z',
    category: 'চা-নাস্তা ও আপ্যায়ন',
    description: 'খদ্দের ও মেকানিক ভাইদের আপ্যায়ন খরচ',
    amount: 450,
    paymentMethod: 'Cash',
  },
  {
    id: 6,
    expenseDate: '2026-11-06T15:20:00Z',
    category: 'মেরামত ও রক্ষণাবেক্ষণ',
    description: 'দোকানের ক্যাশ ড্রয়ার ও তাক মেরামত',
    amount: 1200,
    paymentMethod: 'Cash',
  },
  {
    id: 7,
    expenseDate: '2026-11-07T12:00:00Z',
    category: 'প্যাকিং ও স্টেশনারি',
    description: 'বিল মেমো বুক ও প্রিন্টিং রিবন ক্রয়',
    amount: 650,
    paymentMethod: 'Cash',
  },
  {
    id: 8,
    expenseDate: '2026-11-08T10:15:00Z',
    category: 'পরিবহন ও যাতায়াত',
    description: 'স্টেশন থেকে কার্টন ডেলিভারি কুলি খরচ',
    amount: 420,
    paymentMethod: 'Cash',
  },
  {
    id: 9,
    expenseDate: '2026-11-09T10:00:00Z',
    category: 'অন্যান্য খরচ',
    description: 'মসজিদ চাঁদা ও বাজার ফান্ড',
    amount: 350,
    paymentMethod: 'Cash',
  },
  {
    id: 10,
    expenseDate: '2026-11-09T11:45:00Z',
    category: 'চা-নাস্তা ও আপ্যায়ন',
    description: 'সকালের নাস্তা ও চা',
    amount: 280,
    paymentMethod: 'Cash',
  },
];

export const initialCashTx: CashTransaction[] = [
  {
    id: 1,
    txDate: '2026-11-01T08:00:00Z',
    txType: 'IN',
    source: 'Opening_Balance',
    reference: 'OPEN-CASH',
    amount: 15000,
    note: 'মাস শুরুর ক্যাশ ওপেনিং',
  },
  {
    id: 2,
    txDate: '2026-11-01T10:00:00Z',
    txType: 'OUT',
    source: 'Expense',
    reference: 'EXP-1',
    amount: 6000,
    note: 'দোকান ভাড়া',
  },
  {
    id: 3,
    txDate: '2026-11-02T10:30:00Z',
    txType: 'IN',
    source: 'Sale',
    reference: 'DM-S-20261102-0001',
    amount: 2000,
    note: 'সেলস পেমেন্ট (ক্যাশ)',
  },
  {
    id: 4,
    txDate: '2026-11-02T16:00:00Z',
    txType: 'OUT',
    source: 'Expense',
    reference: 'EXP-2',
    amount: 250,
    note: 'চা-নাস্তা ও আপ্যায়ন',
  },
  {
    id: 5,
    txDate: '2026-11-03T09:00:00Z',
    txType: 'OUT',
    source: 'Expense',
    reference: 'EXP-3',
    amount: 180,
    note: 'পরিবহন ও যাতায়াত',
  },
  {
    id: 6,
    txDate: '2026-11-03T09:30:00Z',
    txType: 'IN',
    source: 'Collection',
    reference: 'COL-20261103-01',
    amount: 500,
    note: 'কাস্টমার বকেয়া আদায়',
  },
];

export const initialStaff: Staff[] = [
  {
    id: 1,
    name: 'মোঃ শফিকুল ইসলাম',
    role: 'সিনিয়র সেলসম্যান ও কাউন্টার ইনচার্জ',
    phone: '01720-112233',
    monthlySalary: 18000,
    joinDate: '2025-01-15',
    status: 'active',
  },
  {
    id: 2,
    name: 'মোঃ কবির হোসেন',
    role: 'ট্র্যাক্টর মেকানিক ও পার্টস বিশেষজ্ঞ',
    phone: '01830-445566',
    monthlySalary: 15000,
    joinDate: '2025-06-01',
    status: 'active',
  },
  {
    id: 3,
    name: 'রবিন মিয়া',
    role: 'স্টোর হেল্পার ও ডেলিভারি বয়',
    phone: '01640-778899',
    monthlySalary: 10000,
    joinDate: '2026-02-10',
    status: 'active',
  },
];

export const initialAttendance: StaffAttendance[] = [
  {
    id: 1,
    staffId: 1,
    staffName: 'মোঃ শফিকুল ইসলাম',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    note: 'সকাল ৯টায় উপস্থিত',
  },
  {
    id: 2,
    staffId: 2,
    staffName: 'মোঃ কবির হোসেন',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    note: 'ওয়ার্কশপে ডিউটি',
  },
  {
    id: 3,
    staffId: 3,
    staffName: 'রবিন মিয়া',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    note: 'স্টোর চেকিং',
  },
];

export const initialSalaryPayments: StaffSalaryPayment[] = [];

// Default System Users
export const initialUsers: AppUser[] = [
  {
    id: 1,
    name: 'মোঃ দুলাল হোসেন (প্রোপ্রাইটর)',
    phone: '01712-345678',
    email: 'admin@dulalmotors.com',
    password: 'admin',
    role: 'admin',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'মোঃ শফিকুল ইসলাম (সেলসম্যান)',
    phone: '01720-112233',
    email: 'shafiq@dulalmotors.com',
    password: 'staff',
    role: 'staff',
    staffId: 1,
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 3,
    name: 'হাজী আব্দুল কাদের মাস্টার (গ্রাহক)',
    phone: '01815-998877',
    email: 'kader@gmail.com',
    password: 'user',
    role: 'customer',
    customerId: 2,
    createdAt: '2026-01-10T00:00:00Z',
  },
];

// Initial Customer Online Orders
export const initialCustomerOrders: CustomerOrder[] = [
  {
    id: 1,
    orderNo: 'DM-ORD-20261103-0001',
    customerId: 2,
    customerName: 'হাজী আব্দুল কাদের মাস্টার',
    customerPhone: '01815-998877',
    deliveryAddress: 'গঙ্গাচড়া বাজার, রংপুর',
    vehicleModel: 'Sonalika 60 RX',
    orderDate: '2026-11-03T10:15:00Z',
    status: 'pending',
    items: [
      {
        productId: 4,
        productName: 'Sonalika Fuel Filter Assembly Original',
        qty: 2,
        unit: 'পিস',
        unitPrice: 580,
        lineTotal: 1160,
      },
      {
        productId: 5,
        productName: 'Mobil Super 1000 20W-50 4L Can',
        qty: 1,
        unit: 'পিস',
        unitPrice: 2350,
        lineTotal: 2350,
      },
    ],
    subtotal: 3510,
    deliveryFee: 100,
    total: 3610,
    paymentPreference: 'Cash_on_Delivery',
    notes: 'জরুরী ভিত্তিতে পাঠাবেন। ট্র্যাক্টরের সার্ভিসিং চলছে।',
  },
  {
    id: 2,
    orderNo: 'DM-ORD-20261102-0002',
    customerId: 4,
    customerName: 'মোঃ তারেক রহমান (পাওয়ার টিলার)',
    customerPhone: '01622-334455',
    deliveryAddress: 'কাউনিয়া বাস স্ট্যান্ড, রংপুর',
    vehicleModel: 'Dongfeng 12HP',
    orderDate: '2026-11-02T15:30:00Z',
    status: 'confirmed',
    items: [
      {
        productId: 9,
        productName: 'Fenner Industrial V-Belt B-48',
        qty: 2,
        unit: 'পিস',
        unitPrice: 260,
        lineTotal: 520,
      },
      {
        productId: 1,
        productName: 'SKF Deep Groove Ball Bearing 6205-2RS',
        qty: 1,
        unit: 'পিস',
        unitPrice: 380,
        lineTotal: 380,
      },
    ],
    subtotal: 900,
    deliveryFee: 0,
    total: 900,
    paymentPreference: 'Store_Pickup',
    notes: 'দোকান থেকে বিকেলে পিকআপ করব।',
  },
];

// Helper to get from LocalStorage with fallback
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error loading ${key}:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

export const StorageService = {
  getProducts(): Product[] {
    return loadFromStorage(STORAGE_KEYS.PRODUCTS, initialProducts);
  },
  saveProducts(products: Product[]): void {
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
  },

  getCustomers(): Customer[] {
    return loadFromStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  },
  saveCustomers(customers: Customer[]): void {
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
  },

  getSuppliers(): Supplier[] {
    return loadFromStorage(STORAGE_KEYS.SUPPLIERS, initialSuppliers);
  },
  saveSuppliers(suppliers: Supplier[]): void {
    saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
  },

  getSales(): Sale[] {
    return loadFromStorage(STORAGE_KEYS.SALES, initialSales);
  },
  saveSales(sales: Sale[]): void {
    saveToStorage(STORAGE_KEYS.SALES, sales);
  },

  getReturns(): SaleReturn[] {
    return loadFromStorage(STORAGE_KEYS.RETURNS, initialReturns);
  },
  saveReturns(returns: SaleReturn[]): void {
    saveToStorage(STORAGE_KEYS.RETURNS, returns);
  },

  getPurchases(): Purchase[] {
    return loadFromStorage(STORAGE_KEYS.PURCHASES, initialPurchases);
  },
  savePurchases(purchases: Purchase[]): void {
    saveToStorage(STORAGE_KEYS.PURCHASES, purchases);
  },

  getCollections(): Collection[] {
    return loadFromStorage(STORAGE_KEYS.COLLECTIONS, initialCollections);
  },
  saveCollections(collections: Collection[]): void {
    saveToStorage(STORAGE_KEYS.COLLECTIONS, collections);
  },

  getExpenses(): Expense[] {
    return loadFromStorage(STORAGE_KEYS.EXPENSES, initialExpenses);
  },
  saveExpenses(expenses: Expense[]): void {
    saveToStorage(STORAGE_KEYS.EXPENSES, expenses);
  },

  getCashTransactions(): CashTransaction[] {
    return loadFromStorage(STORAGE_KEYS.CASH_TX, initialCashTx);
  },
  saveCashTransactions(txs: CashTransaction[]): void {
    saveToStorage(STORAGE_KEYS.CASH_TX, txs);
  },

  getStockAdjustments(): StockAdjustment[] {
    return loadFromStorage(STORAGE_KEYS.STOCK_ADJUSTMENTS, []);
  },
  saveStockAdjustments(adjs: StockAdjustment[]): void {
    saveToStorage(STORAGE_KEYS.STOCK_ADJUSTMENTS, adjs);
  },

  getStaff(): Staff[] {
    return loadFromStorage(STORAGE_KEYS.STAFF, initialStaff);
  },
  saveStaff(staff: Staff[]): void {
    saveToStorage(STORAGE_KEYS.STAFF, staff);
  },

  getAttendance(): StaffAttendance[] {
    return loadFromStorage(STORAGE_KEYS.ATTENDANCE, initialAttendance);
  },
  saveAttendance(attendance: StaffAttendance[]): void {
    saveToStorage(STORAGE_KEYS.ATTENDANCE, attendance);
  },

  getSalaryPayments(): StaffSalaryPayment[] {
    return loadFromStorage(STORAGE_KEYS.SALARY_PAYMENTS, initialSalaryPayments);
  },
  saveSalaryPayments(payments: StaffSalaryPayment[]): void {
    saveToStorage(STORAGE_KEYS.SALARY_PAYMENTS, payments);
  },

  getSettings(): ShopSettings {
    return loadFromStorage(STORAGE_KEYS.SETTINGS, defaultSettings);
  },
  saveSettings(settings: ShopSettings): void {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  },

  getUsers(): AppUser[] {
    return loadFromStorage(STORAGE_KEYS.USERS, initialUsers);
  },
  saveUsers(users: AppUser[]): void {
    saveToStorage(STORAGE_KEYS.USERS, users);
  },

  getCurrentUser(): AppUser | null {
    return loadFromStorage(STORAGE_KEYS.CURRENT_USER, initialUsers[0]); // default logged in as Admin for instant convenience
  },
  saveCurrentUser(user: AppUser | null): void {
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  },

  getCustomerOrders(): CustomerOrder[] {
    return loadFromStorage(STORAGE_KEYS.CUSTOMER_ORDERS, initialCustomerOrders);
  },
  saveCustomerOrders(orders: CustomerOrder[]): void {
    saveToStorage(STORAGE_KEYS.CUSTOMER_ORDERS, orders);
  },

  // Calculate Customer Current Due dynamically
  getCustomerDue(customerId: number, sales: Sale[], collections: Collection[]): number {
    const totalDueFromSales = sales
      .filter((s) => s.customerId === customerId)
      .reduce((sum, s) => sum + (s.due || 0), 0);

    const totalCollected = collections
      .filter((c) => c.customerId === customerId)
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    return Math.max(0, totalDueFromSales - totalCollected);
  },

  // Calculate Supplier Current Payable dynamically
  getSupplierDue(supplierId: number, purchases: Purchase[]): number {
    return purchases
      .filter((p) => p.supplierId === supplierId)
      .reduce((sum, p) => sum + (p.due || 0), 0);
  },

  // Reset to sample data
  resetAllToDefault(): void {
    saveToStorage(STORAGE_KEYS.PRODUCTS, initialProducts);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    saveToStorage(STORAGE_KEYS.SUPPLIERS, initialSuppliers);
    saveToStorage(STORAGE_KEYS.SALES, initialSales);
    saveToStorage(STORAGE_KEYS.RETURNS, initialReturns);
    saveToStorage(STORAGE_KEYS.PURCHASES, initialPurchases);
    saveToStorage(STORAGE_KEYS.COLLECTIONS, initialCollections);
    saveToStorage(STORAGE_KEYS.EXPENSES, initialExpenses);
    saveToStorage(STORAGE_KEYS.CASH_TX, initialCashTx);
    saveToStorage(STORAGE_KEYS.STOCK_ADJUSTMENTS, []);
    saveToStorage(STORAGE_KEYS.STAFF, initialStaff);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, initialAttendance);
    saveToStorage(STORAGE_KEYS.SALARY_PAYMENTS, initialSalaryPayments);
    saveToStorage(STORAGE_KEYS.USERS, initialUsers);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, initialUsers[0]);
    saveToStorage(STORAGE_KEYS.CUSTOMER_ORDERS, initialCustomerOrders);
    saveToStorage(STORAGE_KEYS.SETTINGS, defaultSettings);
  },

  // Export entire DB to JSON
  exportFullBackup(): string {
    const data = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      products: this.getProducts(),
      customers: this.getCustomers(),
      suppliers: this.getSuppliers(),
      sales: this.getSales(),
      returns: this.getReturns(),
      purchases: this.getPurchases(),
      collections: this.getCollections(),
      expenses: this.getExpenses(),
      cashTransactions: this.getCashTransactions(),
      stockAdjustments: this.getStockAdjustments(),
      staff: this.getStaff(),
      attendance: this.getAttendance(),
      salaryPayments: this.getSalaryPayments(),
      users: this.getUsers(),
      customerOrders: this.getCustomerOrders(),
    };
    return JSON.stringify(data, null, 2);
  },

  // Import JSON backup
  importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) this.saveProducts(data.products);
      if (data.customers) this.saveCustomers(data.customers);
      if (data.suppliers) this.saveSuppliers(data.suppliers);
      if (data.sales) this.saveSales(data.sales);
      if (data.returns) this.saveReturns(data.returns);
      if (data.purchases) this.savePurchases(data.purchases);
      if (data.collections) this.saveCollections(data.collections);
      if (data.expenses) this.saveExpenses(data.expenses);
      if (data.cashTransactions) this.saveCashTransactions(data.cashTransactions);
      if (data.stockAdjustments) this.saveStockAdjustments(data.stockAdjustments);
      if (data.staff) this.saveStaff(data.staff);
      if (data.attendance) this.saveAttendance(data.attendance);
      if (data.salaryPayments) this.saveSalaryPayments(data.salaryPayments);
      if (data.users) this.saveUsers(data.users);
      if (data.customerOrders) this.saveCustomerOrders(data.customerOrders);
      if (data.settings) this.saveSettings(data.settings);
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  },
};
