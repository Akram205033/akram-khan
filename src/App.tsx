import React, { useState, useEffect, useMemo } from 'react';
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
  OrderStatus,
  PaymentMethod,
} from './types/pos';
import { StorageService } from './utils/storage';
import { generateInvoiceNumber } from './utils/formatters';
import { Navbar } from './components/Navbar';
import { Sidebar, PageId } from './components/Sidebar';
import { InvoiceModal } from './components/InvoiceModal';
import { AiPartnerModal } from './components/AiPartnerModal';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './views/DashboardView';
import { PosView } from './views/PosView';
import { CustomerPortalView } from './views/CustomerPortalView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { ProductsView } from './views/ProductsView';
import { PurchasesView } from './views/PurchasesView';
import { CustomersView } from './views/CustomersView';
import { CustomerCollectionView } from './views/CustomerCollectionView';
import { StaffView } from './views/StaffView';
import { ExpensesView } from './views/ExpensesView';
import { CashRegisterView } from './views/CashRegisterView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAiPartnerOpen, setIsAiPartnerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Applet Data State loaded from persistent storage
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [sales, setSales] = useState<Sale[]>(() => StorageService.getSales());
  const [returns, setReturns] = useState<SaleReturn[]>(() => StorageService.getReturns());
  const [purchases, setPurchases] = useState<Purchase[]>(() => StorageService.getPurchases());
  const [collections, setCollections] = useState<Collection[]>(() => StorageService.getCollections());
  const [expenses, setExpenses] = useState<Expense[]>(() => StorageService.getExpenses());
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() =>
    StorageService.getCashTransactions()
  );
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() =>
    StorageService.getStockAdjustments()
  );
  const [staff, setStaff] = useState<Staff[]>(() => StorageService.getStaff());
  const [attendance, setAttendance] = useState<StaffAttendance[]>(() => StorageService.getAttendance());
  const [salaryPayments, setSalaryPayments] = useState<StaffSalaryPayment[]>(() =>
    StorageService.getSalaryPayments()
  );
  const [settings, setSettings] = useState<ShopSettings>(() => StorageService.getSettings());

  // Authentication State
  const [users, setUsers] = useState<AppUser[]>(() => StorageService.getUsers());
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => StorageService.getCurrentUser());

  // Customer Online Orders State
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>(() =>
    StorageService.getCustomerOrders()
  );

  // Invoice Receipt Modal State
  const [activeInvoiceSale, setActiveInvoiceSale] = useState<Sale | null>(null);

  // Quick Customer Collection trigger state
  const [preSelectedCustomerForCollection, setPreSelectedCustomerForCollection] =
    useState<Customer | null>(null);

  // Keyboard shortcut listener (Escape to close sidebar/modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setIsAiPartnerOpen(false);
        setIsAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper: Calculate Customer Due dynamically
  const getCustomerDue = (customerId: number): number => {
    return StorageService.getCustomerDue(customerId, sales, collections);
  };

  // Helper: Calculate Supplier Due dynamically
  const getSupplierDue = (supplierId: number): number => {
    return StorageService.getSupplierDue(supplierId, purchases);
  };

  // Live Net Cash Balance: Sum of IN - Sum of OUT
  const cashBalance = useMemo(() => {
    return cashTransactions.reduce((balance, tx) => {
      return tx.txType === 'IN' ? balance + tx.amount : balance - tx.amount;
    }, 0);
  }, [cashTransactions]);

  // Aggregate Market Due (all customers)
  const totalMarketDue = useMemo(() => {
    return customers.reduce((sum, c) => sum + getCustomerDue(c.id), 0);
  }, [customers, sales, collections]);

  // Aggregate Supplier Due
  const totalSupplierDue = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + getSupplierDue(s.id), 0);
  }, [suppliers, purchases]);

  // Low stock products count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStock).length;
  }, [products]);

  // Count of customers with positive due
  const dueCustomerCount = useMemo(() => {
    return customers.filter((c) => getCustomerDue(c.id) > 0).length;
  }, [customers, sales, collections]);

  // Pending online orders count
  const pendingOrdersCount = useMemo(() => {
    return customerOrders.filter((o) => o.status === 'pending').length;
  }, [customerOrders]);

  // --- ACTIONS & HANDLERS ---

  // Auth Handlers
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    StorageService.saveCurrentUser(user);
    if (user.role === 'customer') {
      setCurrentPage('orders');
    }
  };

  const handleRegister = (newUser: Omit<AppUser, 'id' | 'createdAt'>) => {
    const createdUser: AppUser = {
      id: Date.now(),
      ...newUser,
      createdAt: new Date().toISOString(),
    };
    const updated = [...users, createdUser];
    setUsers(updated);
    StorageService.saveUsers(updated);
    setCurrentUser(createdUser);
    StorageService.saveCurrentUser(createdUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    StorageService.saveCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  // Customer Order Handlers
  const handlePlaceOrder = (newOrder: CustomerOrder) => {
    const updated = [newOrder, ...customerOrders];
    setCustomerOrders(updated);
    StorageService.saveCustomerOrders(updated);
  };

  const handleUpdateOrderStatus = (orderId: number, status: OrderStatus) => {
    const updated = customerOrders.map((o) => (o.id === orderId ? { ...o, status } : o));
    setCustomerOrders(updated);
    StorageService.saveCustomerOrders(updated);
  };

  // Convert Customer Order to Sale Invoice
  const handleConvertOrderToSale = (order: CustomerOrder) => {
    // Check stock availability
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && item.qty > prod.stock) {
        alert(
          `পণ্য "${item.productName}" এর পর্যাপ্ত স্টক নেই। বর্তমান মজুত: ${prod.stock} ${prod.unit}`
        );
        return;
      }
    }

    const invoiceNo = generateInvoiceNumber('DM-S', sales.length);
    const saleDate = new Date().toISOString();

    const saleItems = order.items.map((it, idx) => {
      const prod = products.find((p) => p.id === it.productId);
      return {
        id: idx + 1,
        saleId: sales.length + 1,
        productId: it.productId,
        productName: it.productName,
        qty: it.qty,
        unit: it.unit,
        unitPrice: it.unitPrice,
        costPrice: prod ? prod.purchasePrice : it.unitPrice * 0.8,
        lineTotal: it.lineTotal,
      };
    });

    // Deduct stock from products
    const updatedProducts = products.map((p) => {
      const match = order.items.find((it) => it.productId === p.id);
      if (match) {
        return {
          ...p,
          stock: Math.max(0, p.stock - match.qty),
        };
      }
      return p;
    });

    const isPaidOnline = order.paymentPreference === 'bKash';
    const newSale: Sale = {
      id: Date.now(),
      invoiceNo,
      customerId: order.customerId || null,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      saleDate,
      subtotal: order.subtotal,
      discount: 0,
      total: order.total,
      paid: isPaidOnline ? order.total : order.paymentPreference === 'Cash_on_Delivery' ? order.total : order.total,
      due: 0,
      paymentMethod: order.paymentPreference === 'bKash' ? 'bKash' : 'Cash',
      note: `অনলাইন অর্ডার #${order.orderNo} থেকে রূপান্তর। ঠিকানা: ${order.deliveryAddress}`,
      items: saleItems,
    };

    // Update sales
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    StorageService.saveSales(updatedSales);

    // Update products
    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    // Record cash transaction
    const newCashTx: CashTransaction = {
      id: Date.now(),
      txDate: saleDate,
      txType: 'IN',
      source: 'Sale',
      reference: invoiceNo,
      amount: newSale.paid,
      note: `অনলাইন অর্ডার বিক্রয় (${order.orderNo})`,
    };
    const updatedTx = [newCashTx, ...cashTransactions];
    setCashTransactions(updatedTx);
    StorageService.saveCashTransactions(updatedTx);

    // Update order status
    const updatedOrders = customerOrders.map((o) =>
      o.id === order.id
        ? { ...o, status: 'delivered' as OrderStatus, convertedSaleInvoice: invoiceNo }
        : o
    );
    setCustomerOrders(updatedOrders);
    StorageService.saveCustomerOrders(updatedOrders);

    // Open print memo modal immediately
    setActiveInvoiceSale(newSale);
  };

  // Complete Standard Sale from POS
  const handleCompleteSale = (newSale: Sale, updatedProducts: Product[]) => {
    const newSales = [newSale, ...sales];
    setSales(newSales);
    StorageService.saveSales(newSales);

    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    if (newSale.paid > 0) {
      const newCashTx: CashTransaction = {
        id: Date.now(),
        txDate: newSale.saleDate,
        txType: 'IN',
        source: 'Sale',
        reference: newSale.invoiceNo,
        amount: newSale.paid,
        note: `বিক্রি বাবদ আদায় (${newSale.paymentMethod})`,
      };
      const updatedTx = [newCashTx, ...cashTransactions];
      setCashTransactions(updatedTx);
      StorageService.saveCashTransactions(updatedTx);
    }

    setActiveInvoiceSale(newSale);
  };

  // Process Sale Return
  const handleProcessReturn = (
    newReturn: SaleReturn,
    updatedProducts: Product[],
    updatedSale?: Sale
  ) => {
    const updatedReturns = [newReturn, ...returns];
    setReturns(updatedReturns);
    StorageService.saveReturns(updatedReturns);

    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    if (updatedSale) {
      const updatedSales = sales.map((s) => (s.id === updatedSale.id ? updatedSale : s));
      setSales(updatedSales);
      StorageService.saveSales(updatedSales);
    }

    if (newReturn.refundMethod === 'Cash') {
      const newCashTx: CashTransaction = {
        id: Date.now(),
        txDate: newReturn.returnDate,
        txType: 'OUT',
        source: 'Return_Refund',
        reference: newReturn.returnNo,
        amount: newReturn.totalRefund,
        note: `পণ্য ফেরত রিফান্ড (${newReturn.invoiceNo})`,
      };
      const updatedTx = [newCashTx, ...cashTransactions];
      setCashTransactions(updatedTx);
      StorageService.saveCashTransactions(updatedTx);
    }
  };

  // Customers
  const handleAddCustomer = (data: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCustomer: Customer = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    StorageService.saveCustomers(updated);
    return newCustomer;
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    const updated = customers.map((c) => (c.id === updatedCust.id ? updatedCust : c));
    setCustomers(updated);
    StorageService.saveCustomers(updated);
  };

  const handleDeleteCustomer = (customerId: number) => {
    const updated = customers.filter((c) => c.id !== customerId);
    setCustomers(updated);
    StorageService.saveCustomers(updated);
  };

  // Products
  const handleAddProduct = (data: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    const updated = [newProduct, ...products];
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  const handleDeleteProduct = (productId: number) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  const handleAdjustStock = (productId: number, adjustmentQty: number, reason: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const prevStock = prod.stock;
    const newStock = Math.max(0, prevStock + adjustmentQty);

    const updatedProductList = products.map((p) =>
      p.id === productId ? { ...p, stock: newStock, updatedAt: new Date().toISOString() } : p
    );
    setProducts(updatedProductList);
    StorageService.saveProducts(updatedProductList);

    const adjRecord: StockAdjustment = {
      id: Date.now(),
      productId,
      productName: prod.name,
      prevStock,
      adjustmentQty,
      newStock,
      reason,
      date: new Date().toISOString(),
    };
    const updatedAdj = [adjRecord, ...stockAdjustments];
    setStockAdjustments(updatedAdj);
    StorageService.saveStockAdjustments(updatedAdj);
  };

  // Purchases & Suppliers
  const handleAddPurchase = (newPurchase: Purchase, updatedProducts: Product[]) => {
    const newPurchases = [newPurchase, ...purchases];
    setPurchases(newPurchases);
    StorageService.savePurchases(newPurchases);

    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    if (newPurchase.paid > 0) {
      const newCashTx: CashTransaction = {
        id: Date.now(),
        txDate: newPurchase.purchaseDate,
        txType: 'OUT',
        source: 'Purchase',
        reference: newPurchase.purchaseNo,
        amount: newPurchase.paid,
        note: `মহাজন ক্রয় চালান পরিশোধ (${newPurchase.supplierName || 'সাপ্লায়ার'})`,
      };
      const updatedTx = [newCashTx, ...cashTransactions];
      setCashTransactions(updatedTx);
      StorageService.saveCashTransactions(updatedTx);
    }
  };

  const handleAddSupplier = (data: Omit<Supplier, 'id' | 'createdAt'>): Supplier => {
    const newSupplier: Supplier = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    const updated = [newSupplier, ...suppliers];
    setSuppliers(updated);
    StorageService.saveSuppliers(updated);
    return newSupplier;
  };

  const handlePaySupplier = (
    supplierId: number,
    amount: number,
    method: PaymentMethod,
    note: string
  ) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const newCashTx: CashTransaction = {
      id: Date.now(),
      txDate: new Date().toISOString(),
      txType: 'OUT',
      source: 'Purchase',
      reference: `SUP-PAY-#${supplierId}`,
      amount,
      note: `মহাজন "${supplier?.name || ''}" কে দেনা পরিশোধ${note ? `: ${note}` : ''}`,
    };
    const updatedTx = [newCashTx, ...cashTransactions];
    setCashTransactions(updatedTx);
    StorageService.saveCashTransactions(updatedTx);
  };

  // Collections
  const handleAddCollection = (newCollection: Collection) => {
    const updatedCollections = [newCollection, ...collections];
    setCollections(updatedCollections);
    StorageService.saveCollections(updatedCollections);

    const newCashTx: CashTransaction = {
      id: Date.now(),
      txDate: newCollection.collectionDate,
      txType: 'IN',
      source: 'Collection',
      reference: newCollection.voucherNo || `COL-${newCollection.id}`,
      amount: newCollection.amount,
      note: `কাস্টমার "${newCollection.customerName || ''}" এর বকেয়া আদায়`,
    };
    const updatedTx = [newCashTx, ...cashTransactions];
    setCashTransactions(updatedTx);
    StorageService.saveCashTransactions(updatedTx);
  };

  // Staff, Attendance & Salary
  const handleAddStaff = (data: Omit<Staff, 'id'>) => {
    const newStaff: Staff = {
      id: Date.now(),
      ...data,
    };
    const updated = [...staff, newStaff];
    setStaff(updated);
    StorageService.saveStaff(updated);
  };

  const handleUpdateStaff = (updatedStaff: Staff) => {
    const updated = staff.map((s) => (s.id === updatedStaff.id ? updatedStaff : s));
    setStaff(updated);
    StorageService.saveStaff(updated);
  };

  const handleDeleteStaff = (id: number) => {
    const updated = staff.filter((s) => s.id !== id);
    setStaff(updated);
    StorageService.saveStaff(updated);
  };

  const handleSaveAttendanceBatch = (records: StaffAttendance[]) => {
    const dateStr = records[0]?.date;
    const remaining = attendance.filter((a) => a.date !== dateStr);
    const updated = [...records, ...remaining];
    setAttendance(updated);
    StorageService.saveAttendance(updated);
  };

  const handleDisburseSalary = (payment: StaffSalaryPayment) => {
    const updated = [payment, ...salaryPayments];
    setSalaryPayments(updated);
    StorageService.saveSalaryPayments(updated);

    const expenseRecord: Expense = {
      id: Date.now(),
      expenseDate: payment.paymentDate,
      category: 'কর্মচারী বেতন',
      description: `${payment.staffName} এর ${payment.month} মাসের বেতন`,
      amount: payment.netPaid,
      paymentMethod: payment.paymentMethod,
    };
    const updatedExpenses = [expenseRecord, ...expenses];
    setExpenses(updatedExpenses);
    StorageService.saveExpenses(updatedExpenses);

    const newCashTx: CashTransaction = {
      id: Date.now() + 1,
      txDate: payment.paymentDate,
      txType: 'OUT',
      source: 'Staff_Salary',
      reference: payment.voucherNo,
      amount: payment.netPaid,
      note: `স্টাফ বেতন: ${payment.staffName} (${payment.month})`,
    };
    const updatedTx = [newCashTx, ...cashTransactions];
    setCashTransactions(updatedTx);
    StorageService.saveCashTransactions(updatedTx);
  };

  // Expenses
  const handleAddExpense = (data: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      id: Date.now(),
      ...data,
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    StorageService.saveExpenses(updated);

    const newCashTx: CashTransaction = {
      id: Date.now(),
      txDate: newExpense.expenseDate,
      txType: 'OUT',
      source: 'Expense',
      reference: `EXP-#${newExpense.id}`,
      amount: newExpense.amount,
      note: `${newExpense.category}: ${newExpense.description}`,
    };
    const updatedTx = [newCashTx, ...cashTransactions];
    setCashTransactions(updatedTx);
    StorageService.saveCashTransactions(updatedTx);
  };

  const handleDeleteExpense = (id: number) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    StorageService.saveExpenses(updated);
  };

  // Manual Cash
  const handleAddManualCashTx = (
    type: 'IN' | 'OUT',
    source: 'Manual_IN' | 'Manual_OUT',
    amount: number,
    note: string
  ) => {
    const newCashTx: CashTransaction = {
      id: Date.now(),
      txDate: new Date().toISOString(),
      txType: type,
      source,
      reference: `MANUAL-${Date.now().toString().slice(-4)}`,
      amount,
      note,
    };
    const updatedTx = [newCashTx, ...cashTransactions];
    setCashTransactions(updatedTx);
    StorageService.saveCashTransactions(updatedTx);
  };

  // Settings
  const handleUpdateSettings = (newSettings: ShopSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleToggleLang = () => {
    const nextLang: 'bn' | 'en' = settings.language === 'bn' ? 'en' : 'bn';
    const updated: ShopSettings = { ...settings, language: nextLang };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const handleOpenCollectionWithCustomer = (customer: Customer) => {
    setPreSelectedCustomerForCollection(customer);
    setCurrentPage('collection');
  };

  const handleDataReset = () => {
    setProducts(StorageService.getProducts());
    setCustomers(StorageService.getCustomers());
    setSuppliers(StorageService.getSuppliers());
    setSales(StorageService.getSales());
    setReturns(StorageService.getReturns());
    setPurchases(StorageService.getPurchases());
    setCollections(StorageService.getCollections());
    setExpenses(StorageService.getExpenses());
    setCashTransactions(StorageService.getCashTransactions());
    setStockAdjustments(StorageService.getStockAdjustments());
    setStaff(StorageService.getStaff());
    setAttendance(StorageService.getAttendance());
    setSalaryPayments(StorageService.getSalaryPayments());
    setUsers(StorageService.getUsers());
    setCurrentUser(StorageService.getCurrentUser());
    setCustomerOrders(StorageService.getCustomerOrders());
    setSettings(StorageService.getSettings());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        settings={settings}
        cashBalance={cashBalance}
        lowStockCount={lowStockCount}
        pendingOrdersCount={pendingOrdersCount}
        currentUser={currentUser}
        onOpenPos={() => setCurrentPage('pos')}
        onOpenOrders={() => setCurrentPage('orders')}
        onOpenAiPartner={() => setIsAiPartnerOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onToggleLang={handleToggleLang}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Responsive Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onSelectPage={(page) => setCurrentPage(page)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          lowStockCount={lowStockCount}
          totalDueCount={dueCustomerCount}
          pendingOrdersCount={pendingOrdersCount}
          currentUser={currentUser}
          onOpenAiPartner={() => setIsAiPartnerOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-[1520px] mx-auto w-full">
          {currentPage === 'dashboard' && (
            <DashboardView
              products={products}
              sales={sales}
              expenses={expenses}
              customers={customers}
              suppliers={suppliers}
              cashTransactions={cashTransactions}
              settings={settings}
              cashBalance={cashBalance}
              totalMarketDue={totalMarketDue}
              totalSupplierDue={totalSupplierDue}
              onNavigate={(page) => setCurrentPage(page)}
              onViewInvoice={(sale) => setActiveInvoiceSale(sale)}
              onQuickAddProduct={() => setCurrentPage('products')}
              onQuickExpense={() => setCurrentPage('expenses')}
              onQuickCollection={() => setCurrentPage('collection')}
            />
          )}

          {currentPage === 'pos' && (
            <PosView
              products={products}
              customers={customers}
              settings={settings}
              salesCount={sales.length}
              getCustomerDue={getCustomerDue}
              onCompleteSale={handleCompleteSale}
              onAddNewCustomer={handleAddCustomer}
            />
          )}

          {currentPage === 'orders' && (
            <CustomerPortalView
              products={products}
              orders={customerOrders}
              settings={settings}
              currentUser={currentUser}
              ordersCount={customerOrders.length}
              onPlaceOrder={handlePlaceOrder}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onConvertOrderToSale={handleConvertOrderToSale}
            />
          )}

          {currentPage === 'salesHistory' && (
            <SalesHistoryView
              sales={sales}
              returns={returns}
              products={products}
              settings={settings}
              returnsCount={returns.length}
              onViewInvoice={(sale) => setActiveInvoiceSale(sale)}
              onProcessReturn={handleProcessReturn}
            />
          )}

          {currentPage === 'products' && (
            <ProductsView
              products={products}
              stockAdjustments={stockAdjustments}
              settings={settings}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {currentPage === 'purchases' && (
            <PurchasesView
              purchases={purchases}
              suppliers={suppliers}
              products={products}
              settings={settings}
              purchasesCount={purchases.length}
              onAddPurchase={handleAddPurchase}
              onAddSupplier={handleAddSupplier}
              onPaySupplier={handlePaySupplier}
            />
          )}

          {currentPage === 'customers' && (
            <CustomersView
              customers={customers}
              sales={sales}
              collections={collections}
              settings={settings}
              getCustomerDue={getCustomerDue}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onOpenCollectionModal={handleOpenCollectionWithCustomer}
            />
          )}

          {currentPage === 'collection' && (
            <CustomerCollectionView
              customers={customers}
              collections={collections}
              settings={settings}
              collectionsCount={collections.length}
              getCustomerDue={getCustomerDue}
              onAddCollection={handleAddCollection}
              preSelectedCustomerId={preSelectedCustomerForCollection?.id}
            />
          )}

          {currentPage === 'staff' && (
            <StaffView
              staffList={staff}
              attendanceList={attendance}
              salaryPayments={salaryPayments}
              settings={settings}
              salaryPaymentsCount={salaryPayments.length}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
              onSaveAttendanceBatch={handleSaveAttendanceBatch}
              onDisburseSalary={handleDisburseSalary}
            />
          )}

          {currentPage === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              settings={settings}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {currentPage === 'cash' && (
            <CashRegisterView
              cashTransactions={cashTransactions}
              settings={settings}
              cashBalance={cashBalance}
              onAddManualCashTx={handleAddManualCashTx}
            />
          )}

          {currentPage === 'reports' && (
            <ReportsView
              sales={sales}
              expenses={expenses}
              products={products}
              customers={customers}
              settings={settings}
              getCustomerDue={getCustomerDue}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onDataReset={handleDataReset}
              recordsCount={{
                products: products.length,
                customers: customers.length,
                suppliers: suppliers.length,
                sales: sales.length,
                purchases: purchases.length,
                expenses: expenses.length,
              }}
            />
          )}
        </main>
      </div>

      {/* Floating AI Partner Voice Quick Button */}
      <button
        onClick={() => setIsAiPartnerOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-indigo-600 text-slate-950 font-bold shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
        title="এআই পার্টনারের সাথে ভয়েসে কথা বলুন"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
        <span className="hidden sm:inline font-bold text-xs text-slate-950">এআই পার্টনার</span>
        <span className="p-1 rounded-xl bg-slate-950 text-amber-400">
          🎙️
        </span>
      </button>

      {/* Printable Thermal / A4 Memo Modal */}
      <InvoiceModal
        sale={activeInvoiceSale}
        settings={settings}
        onClose={() => setActiveInvoiceSale(null)}
      />

      {/* Auth Modal (Login / Sign Up / Role Switch) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        users={users}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />

      {/* AI Voice Partner & Development Companion Modal */}
      <AiPartnerModal
        isOpen={isAiPartnerOpen}
        onClose={() => setIsAiPartnerOpen(false)}
        products={products}
        customers={customers}
        suppliers={suppliers}
        sales={sales}
        purchases={purchases}
        collections={collections}
        expenses={expenses}
        staff={staff}
        settings={settings}
        cashBalance={cashBalance}
        totalMarketDue={totalMarketDue}
        totalSupplierDue={totalSupplierDue}
        onNavigate={(page) => setCurrentPage(page)}
      />
    </div>
  );
}
