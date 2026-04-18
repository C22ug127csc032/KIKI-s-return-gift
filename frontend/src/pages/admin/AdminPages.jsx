import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiBox, FiChevronDown, FiDownload, FiFileText, FiGrid, FiPlus, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import api from '../../api/api.js';
import { EmptyState, Modal, PageLoader, Pagination } from '../../components/ui/index.jsx';
import { getSellingPrice } from '../../utils/pricing.js';
import { isValidEmail, isValidPhone, normalizePhone } from '../../utils/validation.js';
import { downloadInvoiceFile, showInvoiceDownloadError } from '../../utils/invoiceDownload.js';

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
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
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
            <FiGrid size={22} />
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
                  <FiGrid size={20} />
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
        <EmptyState icon={<FiGrid size={56} />} title="No categories yet" />
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
                            <FiGrid size={20} />
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
  const movementSectionRef = useRef(null);
  const rawMovementSectionRef = useRef(null);
  const [lowStock, setLowStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [rawMaterialMovements, setRawMaterialMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjForm, setAdjForm] = useState({ productId: '', type: 'IN', quantity: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [inventoryView, setInventoryView] = useState('product-movements');
  const [movementFilters, setMovementFilters] = useState({ search: '', type: '', sortBy: 'date-desc', page: 1, pageSize: 10 });
  const [rawMovementFilters, setRawMovementFilters] = useState({ search: '', type: '', sortBy: 'date-desc', page: 1, pageSize: 10 });
  const productOptions = products.map((product) => ({
    value: product._id,
    label: `${product.name}${product.sku ? ` - ${product.sku}` : ''}`,
  }));

  useEffect(() => {
    document.title = 'Inventory - Admin';
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [ls, mv, pr, rmv] = await Promise.all([
      api.get('/inventory/low-stock'),
      api.get('/inventory/movements?limit=200'),
      api.get('/products/admin/all?limit=100'),
      api.get('/raw-materials/movements?limit=20'),
    ]);
    setLowStock(ls.data.data);
    setMovements(mv.data.data);
    setProducts(pr.data.data);
    setRawMaterialMovements(rmv.data.data);
    setLoading(false);
  };

  const handleAdjust = async () => {
    if (!adjForm.productId) {
      toast.error('Product is required');
      return;
    }
    if (adjForm.quantity === '' || Number(adjForm.quantity) < 0) {
      toast.error('Enter a valid quantity');
      return;
    }
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

  const filteredMovements = movements.filter((movement) => {
    const query = movementFilters.search.trim().toLowerCase();
    const matchesSearch = !query || [
      movement.product?.name,
      movement.customerName,
      movement.customerAddress,
      movement.referenceNumber,
      movement.referenceModel,
      movement.reason,
      movement.note,
    ].some((value) => String(value || '').toLowerCase().includes(query));

    const matchesType = !movementFilters.type || movement.type === movementFilters.type;
    return matchesSearch && matchesType;
  });

  const sortedMovements = sortItems(filteredMovements, movementFilters.sortBy, {
    date: (movement) => new Date(movement.createdAt).getTime(),
    product: (movement) => movement.product?.name || '',
    customer: (movement) => movement.customerName || '',
    qty: (movement) => Number(movement.quantity || 0),
    stock: (movement) => Number(movement.newStock || 0),
    type: (movement) => movement.type || '',
  });

  const movementTotalPages = Math.max(1, Math.ceil(sortedMovements.length / movementFilters.pageSize));
  const movementCurrentPage = Math.min(movementFilters.page, movementTotalPages);
  const paginatedMovements = sortedMovements.slice((movementCurrentPage - 1) * movementFilters.pageSize, movementCurrentPage * movementFilters.pageSize);
  const filteredRawMovements = rawMaterialMovements.filter((movement) => {
    const query = rawMovementFilters.search.trim().toLowerCase();
    const matchesSearch = !query || [
      movement.rawMaterial?.name,
      movement.supplier?.name,
      movement.product?.name,
      movement.type,
      movement.unitPrice,
      movement.totalAmount,
    ].some((value) => String(value || '').toLowerCase().includes(query));
    const matchesType = !rawMovementFilters.type || movement.type === rawMovementFilters.type;
    return matchesSearch && matchesType;
  });

  const sortedRawMovements = sortItems(filteredRawMovements, rawMovementFilters.sortBy, {
    date: (movement) => new Date(movement.createdAt).getTime(),
    material: (movement) => movement.rawMaterial?.name || '',
    supplier: (movement) => movement.supplier?.name || '',
    type: (movement) => movement.type || '',
    qty: (movement) => Number(movement.quantity || 0),
    stock: (movement) => Number(movement.newStock || 0),
    total: (movement) => Number(movement.totalAmount || 0),
  });

  const rawMovementTotalPages = Math.max(1, Math.ceil(sortedRawMovements.length / rawMovementFilters.pageSize));
  const rawMovementCurrentPage = Math.min(rawMovementFilters.page, rawMovementTotalPages);
  const paginatedRawMovements = sortedRawMovements.slice((rawMovementCurrentPage - 1) * rawMovementFilters.pageSize, rawMovementCurrentPage * rawMovementFilters.pageSize);

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

      <div className="admin-card">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setInventoryView('product-movements')}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${inventoryView === 'product-movements' ? 'bg-rose-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'}`}
          >
            Recent Product Movements
          </button>
          <button
            type="button"
            onClick={() => setInventoryView('raw-movements')}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${inventoryView === 'raw-movements' ? 'bg-rose-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'}`}
          >
            Raw Material Movements
          </button>
        </div>
      </div>

      {inventoryView === 'product-movements' ? (
      <div ref={movementSectionRef} className="admin-card overflow-hidden">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-800">Recent Product Movements</h2>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            Total: {filteredMovements.length}
          </div>
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
          <div className="relative w-full max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={movementFilters.search}
              onChange={(e) => setMovementFilters({ ...movementFilters, search: e.target.value, page: 1 })}
              placeholder="Search movements..."
              className="input-field h-11 py-2 pl-10 text-sm"
            />
          </div>
          <select value={movementFilters.type} onChange={(e) => setMovementFilters({ ...movementFilters, type: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[160px] py-2 text-sm">
            <option value="">All Types</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
            <option value="ADJUST">ADJUST</option>
          </select>
          <select value={movementFilters.sortBy} onChange={(e) => setMovementFilters({ ...movementFilters, sortBy: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[190px] py-2 text-sm">
            <option value="date-desc">Latest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="product-asc">Product A-Z</option>
            <option value="product-desc">Product Z-A</option>
            <option value="customer-asc">Customer A-Z</option>
            <option value="customer-desc">Customer Z-A</option>
            <option value="qty-desc">Highest Quantity</option>
            <option value="qty-asc">Lowest Quantity</option>
            <option value="stock-desc">Highest New Stock</option>
            <option value="stock-asc">Lowest New Stock</option>
            <option value="type-asc">Type A-Z</option>
            <option value="type-desc">Type Z-A</option>
          </select>
          <select value={movementFilters.pageSize} onChange={(e) => setMovementFilters({ ...movementFilters, pageSize: Number(e.target.value), page: 1 })} className="input-field h-11 w-full max-w-[130px] py-2 text-sm">
            {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  {['#', 'Product', 'Type', 'Qty', 'Prev', 'New', 'Customer', 'Address', 'Reference', 'Date & Time'].map((head) => <th key={head} className="px-2 pb-3 font-medium">{head}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedMovements.map((movement, index) => (
                  <tr key={movement._id} className="hover:bg-gray-50">
                    <td className="px-2 py-2.5 text-gray-500">{(movementCurrentPage - 1) * movementFilters.pageSize + index + 1}</td>
                    <td className="px-2 py-2.5 text-gray-800">{movement.product?.name || '-'}</td>
                  <td className="px-2 py-2.5"><span className={`badge ${movement.type === 'IN' ? 'badge-green' : movement.type === 'OUT' ? 'badge-red' : 'badge-blue'}`}>{movement.type}</span></td>
                  <td className="px-2 py-2.5 font-semibold">{movement.quantity}</td>
                  <td className="px-2 py-2.5 text-gray-500">{movement.previousStock}</td>
                  <td className="px-2 py-2.5 font-semibold text-gray-800">{movement.newStock}</td>
                  <td className="px-2 py-2.5 text-gray-700">{movement.customerName || (movement.referenceModel === 'Manual' ? 'Manual Adjustment' : '-')}</td>
                  <td className="max-w-[220px] px-2 py-2.5 text-gray-500">
                    <span className="block truncate" title={movement.customerAddress || movement.note || movement.reason || ''}>
                      {movement.customerAddress || movement.note || movement.reason || '-'}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-gray-500">{movement.referenceNumber || movement.referenceModel || '-'}</td>
                  <td className="px-2 py-2.5 text-xs text-gray-400 whitespace-nowrap">{new Date(movement.createdAt).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={movementCurrentPage}
          totalPages={movementTotalPages}
          onPageChange={(page) => {
            setMovementFilters({ ...movementFilters, page });
            requestAnimationFrame(() => {
              requestAnimationFrame(() => scrollInventorySectionIntoView(movementSectionRef));
            });
          }}
        />
      </div>
      ) : null}

      <div className="mt-6 space-y-6">
        {inventoryView === 'raw-movements' ? (
        <div ref={rawMovementSectionRef} className="admin-card overflow-hidden">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FiBox size={18} className="text-brand-500" />
              <h2 className="font-semibold text-gray-800">Raw Material Movements</h2>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              Total: {filteredRawMovements.length}
            </div>
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
            <div className="relative w-full max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={rawMovementFilters.search}
                onChange={(e) => setRawMovementFilters({ ...rawMovementFilters, search: e.target.value, page: 1 })}
                placeholder="Search raw movements..."
                className="input-field h-11 py-2 pl-10 text-sm"
              />
            </div>
            <select value={rawMovementFilters.type} onChange={(e) => setRawMovementFilters({ ...rawMovementFilters, type: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[170px] py-2 text-sm">
              <option value="">All Types</option>
              <option value="PURCHASE">PURCHASE</option>
              <option value="USAGE">USAGE</option>
              <option value="ADJUST">ADJUST</option>
            </select>
            <select value={rawMovementFilters.sortBy} onChange={(e) => setRawMovementFilters({ ...rawMovementFilters, sortBy: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[190px] py-2 text-sm">
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="material-asc">Material A-Z</option>
              <option value="material-desc">Material Z-A</option>
              <option value="supplier-asc">Supplier A-Z</option>
              <option value="supplier-desc">Supplier Z-A</option>
              <option value="qty-desc">Highest Quantity</option>
              <option value="qty-asc">Lowest Quantity</option>
              <option value="stock-desc">Highest New Stock</option>
              <option value="stock-asc">Lowest New Stock</option>
              <option value="total-desc">Highest Total</option>
              <option value="total-asc">Lowest Total</option>
              <option value="type-asc">Type A-Z</option>
              <option value="type-desc">Type Z-A</option>
            </select>
            <select value={rawMovementFilters.pageSize} onChange={(e) => setRawMovementFilters({ ...rawMovementFilters, pageSize: Number(e.target.value), page: 1 })} className="input-field h-11 w-full max-w-[130px] py-2 text-sm">
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  {['#', 'Material', 'Supplier', 'Type', 'Qty', 'Unit Price', 'Total', 'Prev', 'New', 'Product', 'Date'].map((head) => <th key={head} className="px-2 pb-3 font-medium">{head}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedRawMovements.map((movement, index) => (
                  <tr key={movement._id} className="hover:bg-gray-50">
                    <td className="px-2 py-2.5 text-gray-500">{(rawMovementCurrentPage - 1) * rawMovementFilters.pageSize + index + 1}</td>
                    <td className="px-2 py-2.5 font-medium text-gray-800">{movement.rawMaterial?.name || '-'}</td>
                    <td className="px-2 py-2.5 text-gray-500">{movement.supplier?.name || '-'}</td>
                    <td className="px-2 py-2.5"><span className={`badge ${movement.type === 'PURCHASE' ? 'badge-green' : movement.type === 'USAGE' ? 'badge-red' : 'badge-blue'}`}>{movement.type}</span></td>
                    <td className="px-2 py-2.5 font-semibold">{movement.quantity}</td>
                    <td className="px-2 py-2.5 text-gray-500">{movement.unitPrice !== undefined && movement.unitPrice !== null ? `Rs.${movement.unitPrice}` : '-'}</td>
                    <td className="px-2 py-2.5 text-gray-500">{movement.totalAmount !== undefined && movement.totalAmount !== null ? `Rs.${movement.totalAmount}` : '-'}</td>
                    <td className="px-2 py-2.5 text-gray-500">{movement.previousStock}</td>
                    <td className="px-2 py-2.5 font-semibold text-gray-800">{movement.newStock}</td>
                    <td className="px-2 py-2.5 text-gray-500">{movement.product?.name || '-'}</td>
                    <td className="px-2 py-2.5 text-xs text-gray-400">{new Date(movement.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={rawMovementCurrentPage}
            totalPages={rawMovementTotalPages}
            onPageChange={(page) => {
              setRawMovementFilters({ ...rawMovementFilters, page });
              requestAnimationFrame(() => scrollInventorySectionIntoView(rawMovementSectionRef));
            }}
          />
        </div>
        ) : null}
      </div>

      <Modal isOpen={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust Stock">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Product *</label>
            <SearchableSelectField
              options={productOptions}
              value={adjForm.productId}
              onChange={(productId) => setAdjForm({ ...adjForm, productId })}
              placeholder="Search product"
            />
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
  const [listFilters, setListFilters] = useState({ search: '', hasPhone: '', sortBy: 'date-desc', page: 1, pageSize: 10 });

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
    if (!form.customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (form.phone && !isValidPhone(form.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    const items = cartItems.filter((item) => item.productId).map((item) => ({ product: item.productId, quantity: Number(item.quantity) }));
    if (!items.length) {
      toast.error('Add at least one item');
      return;
    }
    if (items.some((item) => !item.quantity || item.quantity <= 0)) {
      toast.error('Each item quantity must be greater than 0');
      return;
    }
    setSaving(true);
    try {
      await api.post('/offline-sales', { ...form, customerName: form.customerName.trim(), items });
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
    try {
      const res = await api.get(`/offline-sales/${id}/invoice`, { responseType: 'blob' });
      downloadInvoiceFile(res.data, invoiceNumber);
    } catch (err) {
      await showInvoiceDownloadError(err);
    }
  };

  const filteredSales = sales.filter((sale) => {
    const query = listFilters.search.toLowerCase();
    const matchesSearch = !query || [sale.invoiceNumber, sale.customerName, sale.phone, sale.address].some((value) => String(value || '').toLowerCase().includes(query));
    const matchesPhone = !listFilters.hasPhone || (listFilters.hasPhone === 'yes' ? Boolean(sale.phone) : !sale.phone);
    return matchesSearch && matchesPhone;
  });

  const sortedSales = [...filteredSales].sort((a, b) => {
    if (listFilters.sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (listFilters.sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (listFilters.sortBy === 'total-asc') return Number(a.totalAmount) - Number(b.totalAmount);
    if (listFilters.sortBy === 'total-desc') return Number(b.totalAmount) - Number(a.totalAmount);
    if (listFilters.sortBy === 'customer-asc') return String(a.customerName || '').localeCompare(String(b.customerName || ''));
    if (listFilters.sortBy === 'customer-desc') return String(b.customerName || '').localeCompare(String(a.customerName || ''));
    if (listFilters.sortBy === 'invoice-asc') return String(a.invoiceNumber || '').localeCompare(String(b.invoiceNumber || ''));
    if (listFilters.sortBy === 'invoice-desc') return String(b.invoiceNumber || '').localeCompare(String(a.invoiceNumber || ''));
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
              <option value="customer-desc">Customer Z-A</option>
              <option value="invoice-asc">Invoice A-Z</option>
              <option value="invoice-desc">Invoice Z-A</option>
            </select>
            <select value={listFilters.hasPhone} onChange={(e) => setListFilters({ ...listFilters, hasPhone: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[170px] py-2 text-sm">
              <option value="">All Phone Types</option>
              <option value="yes">With Phone</option>
              <option value="no">Without Phone</option>
            </select>
            <select value={listFilters.pageSize} onChange={(e) => setListFilters({ ...listFilters, pageSize: Number(e.target.value), page: 1 })} className="input-field h-11 w-full max-w-[130px] py-2 text-sm">
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  {['#', 'Invoice', 'Customer', 'Phone', 'Total', 'Date', 'Invoice PDF'].map((head) => <th key={head} className="px-2 pb-3 font-medium">{head}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedSales.map((sale, index) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-2 py-2.5 text-gray-500">{(salesCurrentPage - 1) * listFilters.pageSize + index + 1}</td>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Customer Name *</label>
              <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: normalizePhone(e.target.value) })} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Items *</label>
              <button onClick={addItem} className="text-xs text-brand-500 hover:underline">+ Add item</button>
            </div>
            {cartItems.map((item, index) => (
              <div key={index} className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_96px_auto] sm:items-center">
                <select value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)} className="input-field w-full text-sm">
                  <option value="">Select product</option>
                  {products.map((product) => <option key={product._id} value={product._id}>{product.name} (Rs.{Math.round(Number((product.discountedPrice ?? getSellingPrice(product)) || 0))})</option>)}
                </select>
                <input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} min="1" className="input-field w-full text-sm" />
                {cartItems.length > 1 ? (
                  <button onClick={() => removeItem(index)} className="inline-flex h-11 w-11 items-center justify-center justify-self-start rounded-xl border border-red-100 text-red-400 transition hover:bg-red-50 hover:text-red-600 sm:justify-self-auto">
                    <FiTrash2 size={15} />
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Notes</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Record Sale'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SettingsField({ label, name, type = 'text', placeholder, value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="input-field"
      />
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
    if (form.supportPhone && !isValidPhone(form.supportPhone)) {
      toast.error('Support phone number must be exactly 10 digits');
      return;
    }
    if (form.supportEmail && !isValidEmail(form.supportEmail)) {
      toast.error('Enter a valid support email address');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined && typeof value !== 'object') fd.append(key, value);
      });
      if (qrFile) fd.append('qrImage', qrFile);
      const response = await api.put('/settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(response.data.data || {});
      setQrFile(null);
      toast.success('Settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900">Store Settings</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="admin-card space-y-4">
          <h2 className="font-semibold text-gray-800">Store Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SettingsField label="Store Name" name="storeName" value={form.storeName} onChange={updateField} />
            <SettingsField label="Tagline" name="storeTagline" value={form.storeTagline} onChange={updateField} />
            <SettingsField label="Support Email" name="supportEmail" type="email" value={form.supportEmail} onChange={updateField} />
            <SettingsField label="Support Phone" name="supportPhone" value={form.supportPhone} onChange={updateField} />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Store Address</label>
              <textarea value={form.storeAddress || ''} onChange={(e) => updateField('storeAddress', e.target.value)} rows={2} className="input-field resize-none" />
            </div>
          </div>
        </div>

        <div className="admin-card space-y-4">
          <h2 className="font-semibold text-gray-800">WhatsApp & Payment</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SettingsField label="WhatsApp Number (with country code)" name="whatsappNumber" value={form.whatsappNumber} onChange={updateField} placeholder="919876543210" />
            <SettingsField label="UPI ID" name="upiId" value={form.upiId} onChange={updateField} placeholder="yourstore@upi" />
            <SettingsField label="Bank Account Name" name="bankAccountName" value={form.bankAccountName} onChange={updateField} />
            <SettingsField label="Bank Account Number" name="bankAccountNumber" value={form.bankAccountNumber} onChange={updateField} />
            <SettingsField label="IFSC Code" name="bankIFSC" value={form.bankIFSC} onChange={updateField} />
            <SettingsField label="Branch Name" name="bankBranch" value={form.bankBranch} onChange={updateField} />
            <SettingsField label="GST (%)" name="gstPercentage" type="number" value={form.gstPercentage} onChange={updateField} placeholder="0" />
            <SettingsField label="GST Number" name="gstNumber" value={form.gstNumber} onChange={updateField} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">UPI QR Code Image</label>
            {form.upiQrImage ? <img src={form.upiQrImage} alt="QR" className="mb-2 h-32 w-32 rounded-xl border object-contain" /> : null}
            <input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files[0])} className="input-field text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-xs file:text-brand-600" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Payment Instructions</label>
            <textarea value={form.paymentInstructions || ''} onChange={(e) => updateField('paymentInstructions', e.target.value)} rows={3} className="input-field resize-none" />
          </div>
        </div>

        <div className="admin-card space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800">Footer Settings</h2>
            <p className="mt-1 text-sm text-gray-500">Control the homepage footer CTA, brand text, contact details, and social links.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SettingsField label="Footer CTA Title" name="footerCtaTitle" value={form.footerCtaTitle} onChange={updateField} placeholder="Need a Custom Gift Pack?" />
            <SettingsField label="Footer CTA Button Text" name="footerCtaButtonText" value={form.footerCtaButtonText} onChange={updateField} placeholder="Chat on WhatsApp" />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Footer CTA Subtitle</label>
              <textarea value={form.footerCtaSubtitle || ''} onChange={(e) => updateField('footerCtaSubtitle', e.target.value)} rows={2} className="input-field resize-none" />
            </div>
            <SettingsField label="Footer Brand Title" name="footerBrandTitle" value={form.footerBrandTitle} onChange={updateField} placeholder="KIKI'S" />
            <SettingsField label="Footer Brand Subtitle" name="footerBrandSubtitle" value={form.footerBrandSubtitle} onChange={updateField} placeholder="Return Gift Store" />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Footer Description</label>
              <textarea value={form.footerDescription || ''} onChange={(e) => updateField('footerDescription', e.target.value)} rows={3} className="input-field resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Footer Contact Address</label>
              <textarea value={form.footerContactAddress || ''} onChange={(e) => updateField('footerContactAddress', e.target.value)} rows={2} className="input-field resize-none" />
            </div>
            <SettingsField label="Instagram URL" name="footerInstagramUrl" type="url" value={form.footerInstagramUrl} onChange={updateField} placeholder="https://instagram.com/yourpage" />
            <SettingsField label="Facebook URL" name="footerFacebookUrl" type="url" value={form.footerFacebookUrl} onChange={updateField} placeholder="https://facebook.com/yourpage" />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Footer Copyright Text</label>
              <textarea value={form.footerCopyrightText || ''} onChange={(e) => updateField('footerCopyrightText', e.target.value)} rows={2} className="input-field resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Footer Bottom Text</label>
              <input value={form.footerBottomText || ''} onChange={(e) => updateField('footerBottomText', e.target.value)} className="input-field" />
            </div>
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
