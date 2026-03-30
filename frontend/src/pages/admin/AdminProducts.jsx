import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiGift, FiSearch, FiShoppingBag, FiStar } from 'react-icons/fi';
import api from '../../api/api.js';
import { EmptyState, PageLoader, Pagination } from '../../components/ui/index.jsx';
import { getDiscountPercentage, getMrpPrice, getSellingPrice } from '../../utils/pricing.js';

const emptyForm = {
  name: '',
  description: '',
  mrp: '',
  price: '',
  stock: '',
  category: '',
  occasion: '',
  sku: '',
  featured: false,
  lowStockThreshold: 5,
  isActive: true,
};

export default function AdminProducts() {
  const formRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', category: '', sortBy: '', page: 1, limit: 10 });
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Products - Admin';
    api.get('/categories/all').then((r) => setCategories(r.data.data));
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
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      mrp: product.mrp ?? product.price,
      price: product.price,
      stock: product.stock,
      category: product.category?._id || '',
      occasion: product.occasion || '',
      sku: product.sku || '',
      featured: product.featured,
      lowStockThreshold: product.lowStockThreshold,
      isActive: product.isActive,
    });
    setImages([]);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSave = async () => {
    const mrp = Number(form.mrp || 0);
    const sellingPrice = Number(form.price || 0);

    if (!mrp || mrp < 0 || !sellingPrice || sellingPrice < 0) {
      toast.error('Enter valid MRP and selling price');
      return;
    }

    if (sellingPrice > mrp) {
      toast.error('Selling price cannot be greater than MRP');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
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

  const computedDiscount = getDiscountPercentage(form.mrp, form.price);

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
          <input value={form.name} onChange={setField('name')} placeholder="Product Name *" className="input-field xl:col-span-2" />
          <input type="number" value={form.mrp} onChange={setField('mrp')} min="0" placeholder="MRP Price *" className="input-field" />
          <input type="number" value={form.price} onChange={setField('price')} min="0" placeholder="Selling Price *" className="input-field" />
          <input type="number" value={form.stock} onChange={setField('stock')} min="0" placeholder="Stock *" className="input-field" />
          <input type="number" value={form.lowStockThreshold} onChange={setField('lowStockThreshold')} min="0" placeholder="Stock Alert Level" className="input-field" />
          <select value={form.category} onChange={setField('category')} className="input-field">
            <option value="">Select Category *</option>
            {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
          <input value={form.occasion} onChange={setField('occasion')} placeholder="Occasion" className="input-field" />
          <input value={form.sku} onChange={setField('sku')} placeholder="SKU" className="input-field self-start" />
          <textarea value={form.description} onChange={setField('description')} rows={3} placeholder="Description *" className="input-field resize-none xl:col-span-3" />
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
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-6">
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
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value, page: 1 })}
                className="input-field h-11 w-full max-w-[180px] py-2 text-sm"
              >
                <option value="">Latest First</option>
                <option value="price_asc">Price Low-High</option>
                <option value="price_desc">Price High-Low</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="stock_asc">Stock Low-High</option>
                <option value="stock_desc">Stock High-Low</option>
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
                    {['Product', 'Category', 'Price', 'Stock', 'Featured', 'Status', 'Actions'].map((head) => (
                      <th key={head} className="px-4 py-3 font-medium">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product._id} className="transition-colors hover:bg-brand-50/40">
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
