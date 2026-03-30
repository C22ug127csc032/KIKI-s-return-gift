import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiBox, FiDownload, FiFileText, FiPlus, FiSearch, FiTag, FiTrash2 } from 'react-icons/fi';
import api from '../../api/api.js';
import { EmptyState, Modal, PageLoader, Pagination } from '../../components/ui/index.jsx';
import { getSellingPrice } from '../../utils/pricing.js';

const sortItems = (items, sortBy, accessors) => {
  const [field, direction] = sortBy.split('-');
  const accessor = accessors[field];
  if (!accessor) return items;

  return [...items].sort((a, b) => {
    const rawA = accessor(a);
    const rawB = accessor(b);
    if (typeof rawA === 'number' && typeof rawB === 'number') {
      return direction === 'desc' ? rawB - rawA : rawA - rawB;
    }
    const aValue = String(rawA ?? '').toLowerCase();
    const bValue = String(rawB ?? '').toLowerCase();
    return direction === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
  });
};

export function AdminCategories() {
  const formRef = useRef(null);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [listFilters, setListFilters] = useState({ search: '', status: '', sortBy: 'name-asc', page: 1, pageSize: 10 });

  useEffect(() => {
    document.title = 'Categories - Admin';
    fetchCats();
  }, []);

  const fetchCats = () => {
    setLoading(true);
    api.get('/categories?limit=100').then((r) => setCats(r.data.data)).finally(() => setLoading(false));
  };

  const open = (cat = null) => {
    setEditCat(cat);
    setForm({ name: cat?.name || '', description: cat?.description || '' });
    setImage(null);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const resetForm = () => {
    setEditCat(null);
    setForm({ name: '', description: '' });
    setImage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      if (image) fd.append('image', image);
      if (editCat) await api.put(`/categories/${editCat._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/categories', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(editCat ? 'Category updated' : 'Category created');
      resetForm();
      fetchCats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Deleted');
      fetchCats();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleStatusToggle = async (cat) => {
    try {
      await api.put(`/categories/${cat._id}`, { isActive: !cat.isActive });
      toast.success(`Category ${cat.isActive ? 'deactivated' : 'activated'}`);
      if (editCat?._id === cat._id) setEditCat({ ...cat, isActive: !cat.isActive });
      fetchCats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const filteredCats = cats.filter((cat) => {
    const matchesSearch = !listFilters.search || [cat.name, cat.description].some((value) => String(value || '').toLowerCase().includes(listFilters.search.toLowerCase()));
    const matchesStatus = !listFilters.status || String(cat.isActive) === listFilters.status;
    return matchesSearch && matchesStatus;
  });

  const sortedCats = sortItems(filteredCats, listFilters.sortBy, {
    name: (cat) => cat.name,
    status: (cat) => (cat.isActive ? 'active' : 'inactive'),
  });

  const categoryTotalPages = Math.max(1, Math.ceil(sortedCats.length / listFilters.pageSize));
  const categoryCurrentPage = Math.min(listFilters.page, categoryTotalPages);
  const paginatedCats = sortedCats.slice((categoryCurrentPage - 1) * listFilters.pageSize, categoryCurrentPage * listFilters.pageSize);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Category Management</h1>
        <p className="mt-1 text-sm text-gray-500">Create and manage storefront categories in one place.</p>
      </div>

      <div ref={formRef} className="admin-card mb-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <FiTag size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{editCat ? 'Edit Category' : 'Add Category'}</h2>
            <p className="text-sm text-gray-500">Keep category names, descriptions, and images organized.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Category name *"
            className="input-field"
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            className="input-field xl:col-span-2"
          />
          <div className="xl:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Category Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0] || null)}
              className="input-field text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-xs file:text-brand-600"
            />
          </div>
          <div className="xl:col-span-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              {editCat?.image ? (
                <img src={editCat.image} alt={editCat.name} className="h-12 w-12 rounded-xl border border-gray-200 object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-400">
                  <FiTag size={20} />
                </div>
              )}
              <div className="text-sm text-gray-500">
                {editCat ? 'Editing the selected category.' : 'New categories will appear in shop filters and product forms.'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={saving} className="btn-primary min-w-[160px]">
                {saving ? 'Saving...' : editCat ? 'Update Category' : 'Add Category'}
              </button>
              {editCat ? (
                <button onClick={resetForm} className="btn-outline">
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {loading ? <PageLoader /> : cats.length === 0 ? (
        <EmptyState icon={<FiTag size={56} />} title="No categories yet" />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Category List</h2>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              Total: {cats.length}
            </div>
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
            <div className="relative w-full max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={listFilters.search}
                onChange={(e) => setListFilters({ ...listFilters, search: e.target.value, page: 1 })}
                placeholder="Search categories..."
                className="input-field h-11 py-2 pl-10 text-sm"
              />
            </div>
            <select value={listFilters.status} onChange={(e) => setListFilters({ ...listFilters, status: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[180px] py-2 text-sm">
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select value={listFilters.sortBy} onChange={(e) => setListFilters({ ...listFilters, sortBy: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[180px] py-2 text-sm">
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="status-asc">Status A-Z</option>
              <option value="status-desc">Status Z-A</option>
            </select>
            <select value={listFilters.pageSize} onChange={(e) => setListFilters({ ...listFilters, pageSize: Number(e.target.value), page: 1 })} className="input-field h-11 w-full max-w-[130px] py-2 text-sm">
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs text-gray-500">
                  {['#', 'Image', 'Name', 'Description', 'Status', 'Action'].map((head) => (
                    <th key={head} className="px-4 py-3 font-medium">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedCats.map((cat, index) => (
                  <tr key={cat._id} className="hover:bg-brand-50/40">
                    <td className="px-4 py-3 text-gray-500">{(categoryCurrentPage - 1) * listFilters.pageSize + index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-brand-50">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-brand-400">
                            <FiTag size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                    <td className="max-w-sm px-4 py-3 text-gray-700">{cat.description || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={cat.isActive ? 'badge badge-green' : 'badge badge-red'}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => open(cat)} className="text-sm font-medium text-brand-500 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => handleStatusToggle(cat)} className="text-sm font-medium text-amber-600 hover:underline">
                          {cat.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDelete(cat._id)} className="text-sm font-medium text-red-500 hover:underline">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={categoryCurrentPage} totalPages={categoryTotalPages} onPageChange={(page) => setListFilters({ ...listFilters, page })} />
        </div>
      )}
    </div>
  );
}

export function AdminInventory() {
  const [lowStock, setLowStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [rawMaterialMovements, setRawMaterialMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjForm, setAdjForm] = useState({ productId: '', type: 'IN', quantity: '', note: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Inventory - Admin';
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [ls, mv, pr, rm, rmv] = await Promise.all([
      api.get('/inventory/low-stock'),
      api.get('/inventory/movements?limit=20'),
      api.get('/products/admin/all?limit=100'),
      api.get('/raw-materials'),
      api.get('/raw-materials/movements?limit=20'),
    ]);
    setLowStock(ls.data.data);
    setMovements(mv.data.data);
    setProducts(pr.data.data);
    setRawMaterials(rm.data.data);
    setRawMaterialMovements(rmv.data.data);
    setLoading(false);
  };

  const handleAdjust = async () => {
    setSaving(true);
    try {
      await api.post('/inventory/adjust', { ...adjForm, quantity: Number(adjForm.quantity) });
      toast.success('Stock adjusted');
      setShowAdjust(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Inventory</h1>
        <button onClick={() => setShowAdjust(true)} className="btn-primary flex items-center gap-2"><FiPlus size={16} /> Adjust Stock</button>
      </div>

      {lowStock.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-800"><FiAlertTriangle size={18} /> Low Stock Alert ({lowStock.length} products)</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {lowStock.map((product) => (
              <div key={product._id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5">
                <p className="text-sm font-medium text-gray-800">{product.name}</p>
                <span className="badge badge-red">{product.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="admin-card overflow-hidden">
        <h2 className="mb-4 font-semibold text-gray-800">Recent Product Movements</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                {['Product', 'Type', 'Qty', 'Prev', 'New', 'Reason', 'Date'].map((head) => <th key={head} className="px-2 pb-3 font-medium">{head}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {movements.map((movement) => (
                <tr key={movement._id} className="hover:bg-gray-50">
                  <td className="px-2 py-2.5 text-gray-800">{movement.product?.name || '-'}</td>
                  <td className="px-2 py-2.5"><span className={`badge ${movement.type === 'IN' ? 'badge-green' : movement.type === 'OUT' ? 'badge-red' : 'badge-blue'}`}>{movement.type}</span></td>
                  <td className="px-2 py-2.5 font-semibold">{movement.quantity}</td>
                  <td className="px-2 py-2.5 text-gray-500">{movement.previousStock}</td>
                  <td className="px-2 py-2.5 font-semibold text-gray-800">{movement.newStock}</td>
                  <td className="max-w-xs truncate px-2 py-2.5 text-gray-500">{movement.reason || '-'}</td>
                  <td className="px-2 py-2.5 text-xs text-gray-400">{new Date(movement.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div className="admin-card overflow-hidden">
          <div className="mb-4 flex items-center gap-2">
            <FiBox size={18} className="text-brand-500" />
            <h2 className="font-semibold text-gray-800">Raw Materials Stock</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  {['Material', 'Supplier', 'Unit', 'Stock', 'Purchase Price'].map((head) => <th key={head} className="px-2 pb-3 font-medium">{head}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rawMaterials.map((material) => (
                  <tr key={material._id} className="hover:bg-gray-50">
                    <td className="px-2 py-2.5 font-medium text-gray-800">{material.name}</td>
                    <td className="px-2 py-2.5 text-gray-500">{material.supplier?.name || '-'}</td>
                    <td className="px-2 py-2.5 text-gray-500">{material.unit}</td>
                    <td className="px-2 py-2.5 font-semibold text-gray-800">{material.stock}</td>
                    <td className="px-2 py-2.5 text-gray-500">Rs.{material.purchasePrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card overflow-hidden">
          <div className="mb-4 flex items-center gap-2">
            <FiBox size={18} className="text-brand-500" />
            <h2 className="font-semibold text-gray-800">Raw Material Movements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  {['Material', 'Type', 'Qty', 'Prev', 'New', 'Product', 'Date'].map((head) => <th key={head} className="px-2 pb-3 font-medium">{head}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rawMaterialMovements.map((movement) => (
                  <tr key={movement._id} className="hover:bg-gray-50">
                    <td className="px-2 py-2.5 font-medium text-gray-800">{movement.rawMaterial?.name || '-'}</td>
                    <td className="px-2 py-2.5"><span className={`badge ${movement.type === 'PURCHASE' ? 'badge-green' : movement.type === 'USAGE' ? 'badge-red' : 'badge-blue'}`}>{movement.type}</span></td>
                    <td className="px-2 py-2.5 font-semibold">{movement.quantity}</td>
                    <td className="px-2 py-2.5 text-gray-500">{movement.previousStock}</td>
                    <td className="px-2 py-2.5 font-semibold text-gray-800">{movement.newStock}</td>
                    <td className="px-2 py-2.5 text-gray-500">{movement.product?.name || '-'}</td>
                    <td className="px-2 py-2.5 text-xs text-gray-400">{new Date(movement.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust Stock">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Product *</label>
            <select value={adjForm.productId} onChange={(e) => setAdjForm({ ...adjForm, productId: e.target.value })} className="input-field">
              <option value="">Select product</option>
              {products.map((product) => <option key={product._id} value={product._id}>{product.name} (Stock: {product.stock})</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Type *</label>
            <select value={adjForm.type} onChange={(e) => setAdjForm({ ...adjForm, type: e.target.value })} className="input-field">
              <option value="IN">IN (Add stock)</option>
              <option value="OUT">OUT (Remove stock)</option>
              <option value="ADJUST">ADJUST (Set exact value)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Quantity *</label>
            <input type="number" value={adjForm.quantity} onChange={(e) => setAdjForm({ ...adjForm, quantity: e.target.value })} min="0" className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Note</label>
            <input value={adjForm.note} onChange={(e) => setAdjForm({ ...adjForm, note: e.target.value })} placeholder="Reason for adjustment" className="input-field" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdjust(false)} className="btn-outline flex-1">Cancel</button>
            <button onClick={handleAdjust} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Adjust Stock'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function AdminOfflineSales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customerName: '', phone: '', address: '', notes: '' });
  const [cartItems, setCartItems] = useState([{ productId: '', quantity: 1 }]);
  const [saving, setSaving] = useState(false);
  const [listFilters, setListFilters] = useState({ search: '', sortBy: 'date-desc', page: 1, pageSize: 10 });

  useEffect(() => {
    document.title = 'Offline Sales - Admin';
    fetchSales();
    api.get('/products/admin/all?limit=200').then((r) => setProducts(r.data.data));
  }, []);

  const fetchSales = () => {
    setLoading(true);
    api.get('/offline-sales').then((r) => setSales(r.data.data)).finally(() => setLoading(false));
  };

  const addItem = () => setCartItems([...cartItems, { productId: '', quantity: 1 }]);
  const removeItem = (index) => setCartItems(cartItems.filter((_, i) => i !== index));
  const updateItem = (index, key, value) => {
    const next = [...cartItems];
    next[index][key] = value;
    setCartItems(next);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const items = cartItems.filter((item) => item.productId).map((item) => ({ product: item.productId, quantity: Number(item.quantity) }));
      await api.post('/offline-sales', { ...form, items });
      toast.success('Offline sale recorded');
      setShowModal(false);
      fetchSales();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const downloadInvoice = async (id, invoiceNumber) => {
    const res = await api.get(`/offline-sales/${id}/invoice`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoiceNumber}.pdf`;
    link.click();
  };

  const filteredSales = sales.filter((sale) =>
    !listFilters.search
    || [sale.invoiceNumber, sale.customerName, sale.phone].some((value) => String(value || '').toLowerCase().includes(listFilters.search.toLowerCase()))
  );

  const sortedSales = [...filteredSales].sort((a, b) => {
    if (listFilters.sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (listFilters.sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (listFilters.sortBy === 'total-asc') return Number(a.totalAmount) - Number(b.totalAmount);
    if (listFilters.sortBy === 'total-desc') return Number(b.totalAmount) - Number(a.totalAmount);
    return String(a.customerName || '').localeCompare(String(b.customerName || ''));
  });

  const salesTotalPages = Math.max(1, Math.ceil(sortedSales.length / listFilters.pageSize));
  const salesCurrentPage = Math.min(listFilters.page, salesTotalPages);
  const paginatedSales = sortedSales.slice((salesCurrentPage - 1) * listFilters.pageSize, salesCurrentPage * listFilters.pageSize);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Offline Sales</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><FiPlus size={16} /> New Sale</button>
      </div>

      {loading ? <PageLoader /> : sales.length === 0 ? (
        <EmptyState icon={<FiFileText size={56} />} title="No offline sales yet" action={<button onClick={() => setShowModal(true)} className="btn-primary">Record Sale</button>} />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
            <div className="relative w-full max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={listFilters.search}
                onChange={(e) => setListFilters({ ...listFilters, search: e.target.value, page: 1 })}
                placeholder="Search invoices..."
                className="input-field h-11 py-2 pl-10 text-sm"
              />
            </div>
            <select value={listFilters.sortBy} onChange={(e) => setListFilters({ ...listFilters, sortBy: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[180px] py-2 text-sm">
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="total-desc">Highest Total</option>
              <option value="total-asc">Lowest Total</option>
              <option value="customer-asc">Customer A-Z</option>
            </select>
            <select value={listFilters.pageSize} onChange={(e) => setListFilters({ ...listFilters, pageSize: Number(e.target.value), page: 1 })} className="input-field h-11 w-full max-w-[130px] py-2 text-sm">
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  {['Invoice', 'Customer', 'Phone', 'Total', 'Date', 'Invoice PDF'].map((head) => <th key={head} className="px-2 pb-3 font-medium">{head}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-2 py-2.5 font-medium text-brand-600">{sale.invoiceNumber}</td>
                    <td className="px-2 py-2.5">{sale.customerName}</td>
                    <td className="px-2 py-2.5 text-gray-500">{sale.phone || '-'}</td>
                    <td className="px-2 py-2.5 font-semibold">Rs.{sale.totalAmount}</td>
                    <td className="px-2 py-2.5 text-xs text-gray-400">{new Date(sale.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-2 py-2.5">
                      <button onClick={() => downloadInvoice(sale._id, sale.invoiceNumber)} className="rounded-lg p-1.5 text-gray-400 hover:text-brand-500"><FiDownload size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={salesCurrentPage} totalPages={salesTotalPages} onPageChange={(page) => setListFilters({ ...listFilters, page })} />
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Offline Sale" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1.5 block text-sm font-medium">Customer Name *</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="input-field" /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
            <div className="col-span-2"><label className="mb-1.5 block text-sm font-medium">Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" /></div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Items *</label>
              <button onClick={addItem} className="text-xs text-brand-500 hover:underline">+ Add item</button>
            </div>
            {cartItems.map((item, index) => (
              <div key={index} className="mb-2 flex gap-2">
                <select value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)} className="input-field flex-1 text-sm">
                  <option value="">Select product</option>
                  {products.map((product) => <option key={product._id} value={product._id}>{product.name} (Rs.{product.discountedPrice ?? getSellingPrice(product)})</option>)}
                </select>
                <input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} min="1" className="input-field w-20 text-sm" />
                {cartItems.length > 1 ? <button onClick={() => removeItem(index)} className="px-2 text-red-400 hover:text-red-600"><FiTrash2 size={15} /></button> : null}
              </div>
            ))}
          </div>

          <div><label className="mb-1.5 block text-sm font-medium">Notes</label><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" /></div>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Record Sale'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function AdminSettings() {
  const [form, setForm] = useState({});
  const [qrFile, setQrFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Settings - Admin';
    api.get('/settings').then((r) => setForm(r.data.data || {})).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined && typeof value !== 'object') fd.append(key, value);
      });
      if (qrFile) fd.append('qrImage', qrFile);
      await api.put('/settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  const Field = ({ label, name, type = 'text', placeholder }) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <input type={type} value={form[name] || ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })} placeholder={placeholder} className="input-field" />
    </div>
  );

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900">Store Settings</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="admin-card space-y-4">
          <h2 className="font-semibold text-gray-800">Store Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Store Name" name="storeName" />
            <Field label="Tagline" name="storeTagline" />
            <Field label="Support Email" name="supportEmail" type="email" />
            <Field label="Support Phone" name="supportPhone" />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Store Address</label>
              <textarea value={form.storeAddress || ''} onChange={(e) => setForm({ ...form, storeAddress: e.target.value })} rows={2} className="input-field resize-none" />
            </div>
          </div>
        </div>

        <div className="admin-card space-y-4">
          <h2 className="font-semibold text-gray-800">WhatsApp & Payment</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="WhatsApp Number (with country code)" name="whatsappNumber" placeholder="919876543210" />
            <Field label="UPI ID" name="upiId" placeholder="yourstore@upi" />
            <Field label="Bank Account Name" name="bankAccountName" />
            <Field label="Bank Account Number" name="bankAccountNumber" />
            <Field label="IFSC Code" name="bankIFSC" />
            <Field label="Branch Name" name="bankBranch" />
            <Field label="GST (%)" name="gstPercentage" type="number" placeholder="0" />
            <Field label="GST Number" name="gstNumber" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">UPI QR Code Image</label>
            {form.upiQrImage ? <img src={form.upiQrImage} alt="QR" className="mb-2 h-32 w-32 rounded-xl border object-contain" /> : null}
            <input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files[0])} className="input-field text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-xs file:text-brand-600" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Payment Instructions</label>
            <textarea value={form.paymentInstructions || ''} onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })} rows={3} className="input-field resize-none" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
