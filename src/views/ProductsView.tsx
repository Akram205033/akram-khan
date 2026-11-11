import React, { useState, useMemo } from 'react';
import {
  Product,
  ProductCategory,
  ProductUnit,
  StockAdjustment,
  ShopSettings,
} from '../types/pos';
import { formatMoney, formatDateTime } from '../utils/formatters';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Download,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Trash2,
  History,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  stockAdjustments: StockAdjustment[];
  settings: ShopSettings;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onAdjustStock: (productId: number, adjustmentQty: number, reason: string) => void;
}

const CATEGORIES: ProductCategory[] = [
  'Bearing',
  'Tractor Parts',
  'Engine Parts',
  'Tyre',
  'Lubricant',
  'Electrical',
  'Brake & Clutch',
  'Hardware & Other',
];

const UNITS: ProductUnit[] = ['পিস', 'সেট', 'জোড়া', 'লিটার', 'কেজি', 'মিটার', 'প্যাকেট'];

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  stockAdjustments,
  settings,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'adjust'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  // Form State for Add / Edit
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [banglaName, setBanglaName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Bearing');
  const [unit, setUnit] = useState<ProductUnit>('পিস');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [minStock, setMinStock] = useState<string>('3');
  const [location, setLocation] = useState<string>('');

  // Stock Adjustment Form
  const [adjProductId, setAdjProductId] = useState<number | ''>('');
  const [adjQty, setAdjQty] = useState<string>('');
  const [adjReason, setAdjReason] = useState<string>('ড্যামেজ / নষ্ট');

  // Open Edit Modal / Form
  const startEditing = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setBanglaName(p.banglaName || '');
    setSku(p.sku);
    setCategory(p.category);
    setUnit(p.unit);
    setPurchasePrice(p.purchasePrice.toString());
    setSellingPrice(p.sellingPrice.toString());
    setStock(p.stock.toString());
    setMinStock(p.minStock.toString());
    setLocation(p.location || '');
    setActiveTab('add');
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setBanglaName('');
    setSku('');
    setCategory('Bearing');
    setUnit('পিস');
    setPurchasePrice('');
    setSellingPrice('');
    setStock('');
    setMinStock('3');
    setLocation('');
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('পণ্যের নাম লিখুন।');
      return;
    }

    const cost = parseFloat(purchasePrice) || 0;
    const sell = parseFloat(sellingPrice) || 0;
    const stk = parseFloat(stock) || 0;
    const minStk = parseFloat(minStock) || 0;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: name.trim(),
        banglaName: banglaName.trim() || undefined,
        sku: sku.trim() || editingProduct.sku,
        category,
        unit,
        purchasePrice: cost,
        sellingPrice: sell,
        stock: stk,
        minStock: minStk,
        location: location.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      alert('পণ্য সফলভাবে আপডেট করা হয়েছে!');
    } else {
      const generatedSku = sku.trim() || `DM-${Date.now().toString().slice(-6)}`;
      onAddProduct({
        sku: generatedSku,
        name: name.trim(),
        banglaName: banglaName.trim() || undefined,
        category,
        unit,
        purchasePrice: cost,
        sellingPrice: sell,
        stock: stk,
        minStock: minStk,
        location: location.trim() || undefined,
      });
      alert('নতুন পণ্য সফলভাবে যোগ করা হয়েছে!');
    }

    resetForm();
    setActiveTab('list');
  };

  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProductId) {
      alert('অনুগ্রহ করে পণ্য নির্বাচন করুন।');
      return;
    }
    const qtyNum = parseFloat(adjQty);
    if (isNaN(qtyNum) || qtyNum === 0) {
      alert('স্টক পরিবর্তনের সঠিক সংখ্যা লিখুন (+ যোগ করতে বা - বিয়োগ করতে)।');
      return;
    }

    onAdjustStock(Number(adjProductId), qtyNum, adjReason.trim() || 'সমন্বয়');
    alert('স্টক সফলভাবে সমন্বয় করা হয়েছে!');
    setAdjProductId('');
    setAdjQty('');
    setAdjReason('ড্যামেজ / নষ্ট');
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'LOW' && p.stock <= p.minStock && p.stock > 0) ||
        (stockFilter === 'OUT' && p.stock <= 0);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.banglaName && p.banglaName.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.location && p.location.toLowerCase().includes(q));

      return matchesCategory && matchesStock && matchesSearch;
    });
  }, [products, categoryFilter, stockFilter, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'SKU', 'পণ্যের নাম', 'ক্যাটেগরি', 'একক', 'ক্রয়মূল্য', 'বিক্রয়মূল্য', 'বর্তমান স্টক', 'ন্যূনতম স্টক', 'র্যাক'];
    const rows = products.map((p) => [
      p.id,
      `"${p.sku}"`,
      `"${p.name}"`,
      `"${p.category}"`,
      `"${p.unit}"`,
      p.purchasePrice,
      p.sellingPrice,
      p.stock,
      p.minStock,
      `"${p.location || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dulal_motors_products_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedAdjProduct = products.find((p) => p.id === Number(adjProductId));

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Boxes className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              পণ্য ও ইনভেন্টরি স্টক
            </h2>
            <p className="text-xs text-slate-400">
              মোট পণ্য: {products.length} টি · মোট মজুত: {products.reduce((s, p) => s + p.stock, 0)} ইউনিট
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              setActiveTab('list');
              resetForm();
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            পণ্যের তালিকা
          </button>
          <button
            onClick={() => {
              setActiveTab('add');
              resetForm();
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'add'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {editingProduct ? 'পণ্য সংশোধন' : '+ নতুন পণ্য যোগ'}
          </button>
          <button
            onClick={() => setActiveTab('adjust')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'adjust'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            স্টক সমন্বয় (Adjust)
          </button>
        </div>
      </div>

      {/* Tab 1: Product List */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {/* Filters & Export */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="পণ্য, SKU বা র্যাক খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Category Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              >
                <option value="ALL">সকল ক্যাটেগরি</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Stock Status Buttons */}
              <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setStockFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg ${
                    stockFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  সব ({products.length})
                </button>
                <button
                  onClick={() => setStockFilter('LOW')}
                  className={`px-2.5 py-1 rounded-lg ${
                    stockFilter === 'LOW'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-400'
                  }`}
                >
                  লো স্টক ({products.filter((p) => p.stock <= p.minStock && p.stock > 0).length})
                </button>
                <button
                  onClick={() => setStockFilter('OUT')}
                  className={`px-2.5 py-1 rounded-lg ${
                    stockFilter === 'OUT'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                      : 'text-slate-400'
                  }`}
                >
                  স্টক শেষ ({products.filter((p) => p.stock <= 0).length})
                </button>
              </div>
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>CSV ডাউনলোড</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-4">SKU / পার্ট নং</th>
                    <th className="py-3 px-3">পণ্যের বিবরণ</th>
                    <th className="py-3 px-3">ক্যাটেগরি</th>
                    <th className="py-3 px-3 text-right">ক্রয়মূল্য</th>
                    <th className="py-3 px-3 text-right">বিক্রয়মূল্য</th>
                    <th className="py-3 px-3 text-right">লাভ মার্জিন</th>
                    <th className="py-3 px-3 text-center">বর্তমান স্টক</th>
                    <th className="py-3 px-3">র্যাক</th>
                    <th className="py-3 px-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                        কোনো পণ্য খুঁজে পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isOut = p.stock <= 0;
                      const isLow = p.stock > 0 && p.stock <= p.minStock;
                      const margin = p.sellingPrice - p.purchasePrice;
                      const marginPercent =
                        p.purchasePrice > 0 ? ((margin / p.purchasePrice) * 100).toFixed(0) : '0';

                      return (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-300 whitespace-nowrap">
                            {p.sku}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white leading-tight">
                              {p.name}
                            </div>
                            {p.banglaName && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {p.banglaName}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                            {p.category}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                            {formatMoney(p.purchasePrice, settings.currencySymbol)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                            {formatMoney(p.sellingPrice, settings.currencySymbol)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-400 whitespace-nowrap">
                            +{marginPercent}%
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                isOut
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : isLow
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}
                            >
                              {p.stock} {p.unit}
                            </span>
                            {isLow && (
                              <div className="text-[9px] text-amber-400 mt-0.5">মজুত কম!</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {p.location || '—'}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => startEditing(p)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                title="এডিট করুন"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`আপনি কি "${p.name}" পণ্যটি ডিলিট করতে চান?`)) {
                                    onDeleteProduct(p.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Add / Edit Product Form */}
      {activeTab === 'add' && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="pb-4 border-b border-slate-800 mb-5 flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-400" />
              {editingProduct ? 'পণ্য তথ্য সংশোধন করুন' : 'নতুন পণ্য এন্ট্রি ফরম'}
            </h3>
            {editingProduct && (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                ID: #{editingProduct.id}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmitProduct} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  পণ্যের মূল নাম (ইংরেজি বা বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: SKF Bearing 6205-2RS"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  বাংলা নাম (সহজে চেনার জন্য)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: এসকেএফ বল বিয়ারিং ৬২০৫"
                  value={banglaName}
                  onChange={(e) => setBanglaName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  SKU / পার্ট নম্বর / বারকোড
                </label>
                <input
                  type="text"
                  placeholder="যেমন: BRG-6205 (ফাঁকা রাখলে স্বয়ংক্রিয় তৈরি হবে)"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  ক্যাটেগরি *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 text-xs"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  একক (Unit) *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as ProductUnit)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 text-xs"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  দোকানের র্যাক / তাক নম্বর (Location)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: Rack A-1 / Shelf B-2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  ক্রয়মূল্য (৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  বিক্রয়মূল্য (৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {editingProduct ? 'বর্তমান স্টক' : 'প্রাথমিক উদ্বোধনী স্টক'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  লো স্টক অ্যালার্ট সীমা (Min Stock)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="3"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('list');
                }}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-medium"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
              >
                {editingProduct ? 'আপডেট সংরক্ষণ করুন' : 'পণ্য সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Stock Adjustment */}
      {activeTab === 'adjust' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-white text-sm pb-3 border-b border-slate-800 mb-4 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-amber-400" />
              স্টক বৃদ্ধি বা হ্রাস ফরম
            </h3>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  পণ্য নির্বাচন করুন *
                </label>
                <select
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- পণ্য নির্বাচন --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (মজুত: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {selectedAdjProduct && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">বর্তমান স্টক:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {selectedAdjProduct.stock} {selectedAdjProduct.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SKU / পার্ট নং:</span>
                    <span className="font-mono text-slate-300">{selectedAdjProduct.sku}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  স্টক পরিবর্তন (+ অথবা - লিখুন) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="যেমন: +5 বা -2"
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  স্টক বাড়াতে পজিটিভ সংখ্যা (যেমন: 5) এবং কমাতে মাইনাস সংখ্যা (যেমন: -2) লিখুন।
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  কারণ / মন্তব্য *
                </label>
                <select
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 mb-2"
                >
                  <option value="ড্যামেজ / নষ্ট">ড্যামেজ / নষ্ট হওয়া পার্টস</option>
                  <option value="গণনা ভুল সংশোধন">স্টক গণনা ভুল সংশোধন</option>
                  <option value="ওয়ার্কশপে নমুনা ব্যবহার">ওয়ার্কশপে নমুনা ব্যবহার</option>
                  <option value="কাস্টমার ফেরত">কাস্টমার ফেরত পণ্য</option>
                  <option value="অন্যান্য">অন্যান্য কারণ</option>
                </select>
                <input
                  type="text"
                  placeholder="অতিরিক্ত মন্তব্য (ঐচ্ছিক)..."
                  value={adjReason === 'অন্যান্য' ? '' : adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedAdjProduct}
                className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                স্টক আপডেট সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* Right Log Table (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-white text-sm pb-3 border-b border-slate-800 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              সাম্প্রতিক স্টক সমন্বয় হিস্টোরি
            </h3>

            {stockAdjustments.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                এখনো কোনো স্টক ম্যানুয়াল সমন্বয় করা হয়নি।
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[10px] uppercase">
                      <th className="pb-2">তারিখ</th>
                      <th className="pb-2">পণ্য</th>
                      <th className="pb-2 text-center">পরিবর্তন</th>
                      <th className="pb-2 text-center">নতুন স্টক</th>
                      <th className="pb-2">কারণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {stockAdjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                          {formatDateTime(adj.date)}
                        </td>
                        <td className="py-2.5 font-medium text-white max-w-[160px] truncate">
                          {adj.productName}
                        </td>
                        <td className="py-2.5 text-center font-mono font-bold">
                          <span
                            className={adj.adjustmentQty > 0 ? 'text-emerald-400' : 'text-rose-400'}
                          >
                            {adj.adjustmentQty > 0 ? `+${adj.adjustmentQty}` : adj.adjustmentQty}
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-mono text-slate-300">
                          {adj.newStock}
                        </td>
                        <td className="py-2.5 text-slate-400 text-[11px] max-w-[120px] truncate">
                          {adj.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
