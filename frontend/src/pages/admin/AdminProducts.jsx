import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiChevronDown, FiGift, FiSearch, FiShoppingBag, FiStar, FiX } from 'react-icons/fi';
import api from '../../api/api.js';
import { EmptyState, PageLoader, Pagination } from '../../components/ui/index.jsx';
import { calculatePricing, getDiscountPercentage, getMrpPrice, getSellingPrice } from '../../utils/pricing.js';

const emptyForm = {
  sourcePurchase: '',
  name: '',
  description: '',
  mrp: '',
  basePrice: '',
  price: '',
  discountPercentage: '',
  cgstRate: '',
  sgstRate: '',
  igstRate: '',
  stock: '',
  category: '',
  occasions: [],
  sku: '',
  featured: false,
  lowStockThreshold: 5,
  isActive: true,
};

const occasionOptions = ['Wedding', 'Birthday', 'Diwali', 'Pooja', 'Baby Shower', 'Anniversary', 'Housewarming', 'Corporate', 'Festive', 'Return Gift'];

const normalizeOccasionLabel = (value = '') => value
  .trim()
  .replace(/\s+/g, ' ')
  .split(' ')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
  .join(' ');

function SearchableSelectField({ options, value, onChange, placeholder = 'Search option', disabled = false }) {
  const fieldRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!value) {
      setQuery('');
      return;
    }
    const selectedOption = options.find((option) => option.value === value);
    if (selectedOption) setQuery(selectedOption.label);
  }, [value, options]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!fieldRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleChange = (event) => {
    if (disabled) return;
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setOpen(true);

    const exactMatch = options.find((option) => option.label === nextQuery);
    if (exactMatch) {
      onChange(exactMatch.value);
      return;
    }

    if (!nextQuery.trim()) onChange('');
  };

  const handleSelect = (option) => {
    setQuery(option.label);
    onChange(option.value);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setOpen(false);
  };

  return (
    <div ref={fieldRef} className="relative">
      <input
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        className={`input-field pr-20 ${disabled ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''}`}
      />
      <div className="pointer-events-none absolute inset-y-0 right-11 flex items-center text-gray-300">
        <div className="h-5 border-l border-gray-200" />
      </div>
      {query ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-10 flex items-center justify-center px-2 text-gray-400 transition hover:text-rose-500"
          aria-label="Clear selection"
        >
          <FiX size={15} />
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 transition hover:text-rose-600 disabled:cursor-not-allowed"
        disabled={disabled}
        aria-label="Toggle options"
      >
        <FiChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-20 overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-[0_18px_40px_rgba(225,29,72,0.16)]">
          <div className="border-b border-rose-50 bg-gradient-to-r from-rose-50 to-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
            Select Option
          </div>
          <div className="max-h-56 overflow-y-auto p-2">
            {filteredOptions.length ? filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  option.value === value ? 'bg-rose-100 text-rose-700' : 'text-gray-700 hover:bg-rose-50 hover:text-rose-600'
                }`}
              >
                <FiSearch size={14} className="text-rose-300" />
                <span className="truncate">{option.label}</span>
              </button>
            )) : (
              <div className="px-3 py-3 text-sm text-gray-400">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminProducts() {
  const formRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [boughtProducts, setBoughtProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', category: '', isActive: '', featured: '', lowStock: '', sortBy: 'latest', page: 1, limit: 10 });
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [customOccasion, setCustomOccasion] = useState('');
  const categoryOptions = categories.map((category) => ({
    value: category._id,
    label: category.name,
  }));
  const boughtProductOptions = boughtProducts.map((purchase) => ({
    value: purchase._id,
    label: `${purchase.productName}${purchase.supplier?.name ? ` - ${purchase.supplier.name}` : ''}`,
  }));

  useEffect(() => {
    document.title = 'Products - Admin';
    api.get('/categories/all').then((r) => setCategories(r.data.data));
    api.get('/product-purchases', { params: { unlinked: true, limit: 500 } }).then((r) => setBoughtProducts(r.data.data));
  }, []);

  const fetchProducts = () => {
    setLoading(true);
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
    api.get('/products/admin/all', { params }).then((r) => {
      setProducts(r.data.data);
      setMeta(r.data.meta);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const resetForm = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setImages([]);
    setCustomOccasion('');
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      mrp: product.mrp ?? product.price,
      basePrice: product.basePrice ?? product.price,
      price: product.price,
      discountPercentage: product.discountPercentage ?? '',
      cgstRate: product.cgstRate ?? '',
      sgstRate: product.sgstRate ?? '',
      igstRate: product.igstRate ?? '',
      stock: product.stock,
      sourcePurchase: product.sourcePurchase?._id || '',
      category: product.category?._id || '',
      occasions: product.occasions?.length ? product.occasions : (product.occasion ? [product.occasion] : []),
      sku: product.sku || '',
      featured: product.featured,
      lowStockThreshold: product.lowStockThreshold,
      isActive: product.isActive,
    });
    setImages([]);
    setCustomOccasion('');
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSave = async () => {
    const mrp = Number(form.mrp || 0);
    const basePrice = Number(form.basePrice || 0);
    const stock = Number(form.stock);
    const pricing = calculatePricing({
      basePrice,
      discountPercentage: form.discountPercentage,
      cgstRate: form.cgstRate,
      sgstRate: form.sgstRate,
      igstRate: form.igstRate,
    });
    const sellingPrice = pricing.totalUnitPrice;

    if (!editProduct && !form.sourcePurchase) {
      toast.error('Please select a bought product first');
      return;
    }

    if (!form.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!form.description.trim()) {
      toast.error('Description is required');
      return;
    }

    if (!form.category) {
      toast.error('Category is required');
      return;
    }

    if (Number.isNaN(stock) || stock < 0) {
      toast.error('Enter a valid stock quantity');
      return;
    }

    if (!basePrice || basePrice < 0) {
      toast.error('Enter a valid price');
      return;
    }

    if (sellingPrice > mrp) {
      toast.error('Selling price cannot be greater than MRP');
      return;
    }
    if ([form.discountPercentage, form.cgstRate, form.sgstRate, form.igstRate].some((value) => !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
      toast.error('Discount and tax rates must be between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      const payload = {
        ...form,
        price: sellingPrice,
        gstRate: pricing.gstRate,
        name: form.name.trim(),
        description: form.description.trim(),
        occasions: JSON.stringify(form.occasions),
      };
      Object.entries(payload).forEach(([key, value]) => fd.append(key, value));
      images.forEach((img) => fd.append('images', img));

      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated');
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created');
      }

      resetForm();
      fetchProducts();
      const boughtProductsResponse = await api.get('/product-purchases', { params: { unlinked: true, limit: 500 } });
      setBoughtProducts(boughtProductsResponse.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      if (editProduct?._id === id) resetForm();
      fetchProducts();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleStatusToggle = async (product) => {
    try {
      await api.put(`/products/${product._id}`, { isActive: !product.isActive });
      toast.success(`Product ${product.isActive ? 'deactivated' : 'activated'}`);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const setField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [key]: value });
  };

  const pricingPreview = calculatePricing({
    basePrice: form.basePrice,
    discountPercentage: form.discountPercentage,
    cgstRate: form.cgstRate,
    sgstRate: form.sgstRate,
    igstRate: form.igstRate,
  });
  const computedDiscount = getDiscountPercentage(form.mrp, pricingPreview.totalUnitPrice);
  const selectedBoughtProduct = boughtProducts.find((purchase) => purchase._id === form.sourcePurchase);
  const existingOccasionOptions = Array.from(new Set(
    products.flatMap((product) => product.occasions?.length ? product.occasions : (product.occasion ? [product.occasion] : []))
      .map((occasion) => normalizeOccasionLabel(String(occasion || '')))
      .filter(Boolean)
  )).sort((a, b) => a.localeCompare(b));
  const allOccasionOptions = Array.from(new Set([
    ...existingOccasionOptions,
    ...occasionOptions.map((occasion) => normalizeOccasionLabel(occasion)),
    ...form.occasions.map((occasion) => normalizeOccasionLabel(occasion)),
  ]));
  const toggleOccasion = (occasion) => {
    setForm((current) => ({
      ...current,
      occasions: current.occasions.includes(occasion)
        ? current.occasions.filter((item) => item !== occasion)
        : [...current.occasions, occasion],
    }));
  };
  const addCustomOccasion = () => {
    const normalizedOccasion = normalizeOccasionLabel(customOccasion);
    if (!normalizedOccasion) {
      toast.error('Enter an occasion name');
      return;
    }
    setForm((current) => ({
      ...current,
      occasions: current.occasions.includes(normalizedOccasion)
        ? current.occasions
        : [...current.occasions, normalizedOccasion],
    }));
    setCustomOccasion('');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Product Management</h1>
        <p className="mt-1 text-sm text-gray-500">Create products, upload images, and manage basic catalog details from one page.</p>
      </div>

      <div ref={formRef} className="admin-card mb-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <FiShoppingBag size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{editProduct ? 'Edit Product' : 'Add Product'}</h2>
            <p className="text-sm text-gray-500">Fill in product details and configure raw material usage.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {editProduct ? (
            <input value={form.name} onChange={setField('name')} placeholder="Product Name *" className="input-field xl:col-span-2" />
          ) : (
            <div className="xl:col-span-2">
              <SearchableSelectField
                options={boughtProductOptions}
                value={form.sourcePurchase}
                onChange={(sourcePurchase) => {
                  const selected = boughtProducts.find((purchase) => purchase._id === sourcePurchase);
                  setForm({
                    ...form,
                    sourcePurchase,
                    name: selected?.productName || '',
                    stock: selected?.quantity ?? '',
                  });
                }}
                placeholder={boughtProductOptions.length ? 'Search bought product *' : 'No bought products available'}
                disabled={!boughtProductOptions.length}
              />
              <p className="mt-1 text-xs text-gray-400">
                First buy the new product in Product Purchases, then select it here to add it to the user-facing product catalog.
              </p>
            </div>
          )}
          <input type="number" value={form.mrp} onChange={setField('mrp')} min="0" placeholder="MRP Price *" className="input-field" />
          <input type="number" value={form.basePrice} onChange={setField('basePrice')} min="0" placeholder="Price *" className="input-field" />
          <input type="number" value={form.discountPercentage} onChange={setField('discountPercentage')} min="0" max="100" step="0.01" placeholder="Discount %" className="input-field" />
          <input type="number" value={form.cgstRate} onChange={setField('cgstRate')} min="0" max="100" step="0.01" placeholder="CGST %" className="input-field" />
          <input type="number" value={form.sgstRate} onChange={setField('sgstRate')} min="0" max="100" step="0.01" placeholder="SGST %" className="input-field" />
          <input type="number" value={form.igstRate} onChange={setField('igstRate')} min="0" max="100" step="0.01" placeholder="IGST %" className="input-field" />
          <input type="number" value={form.basePrice === '' ? '' : pricingPreview.totalUnitPrice} readOnly placeholder="Total" className="input-field bg-gray-50 font-semibold text-gray-700" />
          <input
            type="number"
            value={form.stock}
            onChange={setField('stock')}
            min="0"
            placeholder="Stock *"
            disabled={!editProduct}
            className={`input-field ${!editProduct ? 'cursor-not-allowed bg-gray-100 text-gray-400' : ''}`}
          />
          <input type="number" value={form.lowStockThreshold} onChange={setField('lowStockThreshold')} min="0" placeholder="Stock Alert Level" className="input-field" />
          <SearchableSelectField
            options={categoryOptions}
            value={form.category}
            onChange={(categoryId) => setForm({ ...form, category: categoryId })}
            placeholder="Search category *"
          />
          <input value={form.sku} onChange={setField('sku')} placeholder="SKU" className="input-field self-start" />
          <textarea value={form.description} onChange={setField('description')} rows={3} placeholder="Description *" className="input-field resize-none xl:col-span-3" />
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 xl:col-span-4">
            Calculation: Price Rs.{Number(form.basePrice || 0).toFixed(2)} - Discount Rs.{pricingPreview.discountAmountPerUnit.toFixed(2)} + CGST Rs.{pricingPreview.cgstAmountPerUnit.toFixed(2)} + SGST Rs.{pricingPreview.sgstAmountPerUnit.toFixed(2)} + IGST Rs.{pricingPreview.igstAmountPerUnit.toFixed(2)} = Total Rs.{pricingPreview.totalUnitPrice.toFixed(2)}
          </div>
          <div className="xl:col-span-1 self-start">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages([...e.target.files])}
              className="input-field text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-brand-600"
            />
            {editProduct?.images?.length ? <p className="mt-1 text-xs text-gray-400">Current: {editProduct.images.length} image(s). Upload new files to replace.</p> : null}
          </div>
          <div className="xl:col-span-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Occasions</label>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
              <div className="flex flex-wrap gap-2">
                {allOccasionOptions.map((occasion) => {
                  const selected = form.occasions.includes(occasion);
                  return (
                    <button
                      key={occasion}
                      type="button"
                      onClick={() => toggleOccasion(occasion)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        selected
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600'
                      }`}
                    >
                      {occasion}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={customOccasion}
                  onChange={(e) => setCustomOccasion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomOccasion();
                    }
                  }}
                  placeholder="Add new occasion"
                  className="input-field"
                />
                <button type="button" onClick={addCustomOccasion} className="btn-outline whitespace-nowrap">
                  Add Occasion
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Choose from existing occasions or add a new one here. One product can belong to multiple occasions.
              </p>
            </div>
          </div>
        </div>

          <div className="mt-4 flex flex-wrap items-center gap-6">
          {!editProduct && selectedBoughtProduct ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">
              Bought Qty: {selectedBoughtProduct.quantity} | Buy Rate: Rs.{Number(selectedBoughtProduct.purchasePrice || 0).toFixed(2)}
            </div>
          ) : null}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
            Auto Offer: {computedDiscount}% OFF
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.featured} onChange={setField('featured')} className="h-4 w-4 rounded text-brand-500" />
            Featured product
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          {editProduct ? (
            <button onClick={resetForm} className="btn-outline">
              Cancel
            </button>
          ) : null}
          <button onClick={handleSave} disabled={saving} className="btn-primary min-w-[180px]">
            {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>

      {loading ? <PageLoader /> : products.length === 0 ? (
        <EmptyState icon={<FiShoppingBag size={56} />} title="No products yet" />
      ) : (
        <>
          <div className="admin-card overflow-hidden">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Product List</h2>
                <p className="mt-1 text-sm text-gray-500">Search and filter products inside this list section.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                Total: {meta.total || products.length}
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <div className="relative w-full max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="input-field h-11 py-2 pl-10 text-sm"
                />
              </div>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                className="input-field h-11 w-full max-w-[220px] py-2 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
                className="input-field h-11 w-full max-w-[160px] py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <select
                value={filters.featured}
                onChange={(e) => setFilters({ ...filters, featured: e.target.value, page: 1 })}
                className="input-field h-11 w-full max-w-[170px] py-2 text-sm"
              >
                <option value="">All Featured</option>
                <option value="true">Featured</option>
                <option value="false">Not Featured</option>
              </select>
              <select
                value={filters.lowStock}
                onChange={(e) => setFilters({ ...filters, lowStock: e.target.value, page: 1 })}
                className="input-field h-11 w-full max-w-[180px] py-2 text-sm"
              >
                <option value="">All Stock Levels</option>
                <option value="true">Low Stock Only</option>
              </select>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value, page: 1 })}
                className="input-field h-11 w-full max-w-[180px] py-2 text-sm"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-asc">Price Low-High</option>
                <option value="price-desc">Price High-Low</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="stock-asc">Stock Low-High</option>
                <option value="stock-desc">Stock High-Low</option>
                <option value="featured-desc">Featured First</option>
              </select>
              <select
                value={filters.limit}
                onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value), page: 1 })}
                className="input-field h-11 w-full max-w-[130px] py-2 text-sm"
              >
                {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs text-gray-500">
                    {['#', 'Product', 'Category', 'Source', 'Supplier', 'Price', 'Stock', 'Featured', 'Status', 'Actions'].map((head) => (
                      <th key={head} className="px-4 py-3 font-medium">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product, index) => (
                    <tr key={product._id} className="transition-colors hover:bg-brand-50/40">
                      <td className="px-4 py-3 text-gray-500">{(meta.page - 1) * filters.limit + index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {product.images?.[0]?.url
                              ? <img src={product.images[0].url} alt="" className="h-full w-full object-cover" />
                              : <div className="flex h-full w-full items-center justify-center text-brand-300"><FiGift size={18} /></div>}
                          </div>
                          <div>
                            <p className="line-clamp-1 font-medium text-gray-800">{product.name}</p>
                            {product.sku ? <p className="text-xs text-gray-400">{product.sku}</p> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.category?.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{product.sourcePurchase?.productName || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{product.supplier?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">Rs.{product.discountedPrice ?? getSellingPrice(product)}</div>
                        {getDiscountPercentage(product) > 0 ? <div className="text-xs text-gray-400 line-through">Rs.{getMrpPrice(product)}</div> : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${product.stock <= product.lowStockThreshold ? 'text-red-500' : 'text-gray-800'}`}>{product.stock}</span>
                      </td>
                      <td className="px-4 py-3">{product.featured ? <FiStar size={14} className="text-gold-500" /> : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={product.isActive ? 'badge badge-green' : 'badge badge-red'}>{product.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(product)} className="text-sm font-medium text-brand-500 hover:underline">
                            Edit
                          </button>
                          <button onClick={() => handleStatusToggle(product)} className="text-sm font-medium text-amber-600 hover:underline">
                            {product.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(product._id)} className="text-sm font-medium text-red-500 hover:underline">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={(page) => setFilters({ ...filters, page })} />
        </>
      )}
    </div>
  );
}
