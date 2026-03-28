import { useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiBox,
  FiLayers,
  FiPackage,
  FiSearch,
  FiShoppingCart,
  FiTool,
  FiTrash2,
  FiTruck,
} from 'react-icons/fi';
import api from '../../api/api.js';
import { EmptyState, Modal, PageLoader, Pagination } from '../../components/ui/index.jsx';

const supplierFormDefaults = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  isActive: true,
};

const rawMaterialFormDefaults = {
  supplier: '',
  name: '',
  unit: 'pcs',
  stock: '',
  purchasePrice: '',
  lowStockThreshold: '',
  isActive: true,
};

const rawMaterialItemDefaults = {
  name: '',
  unit: 'pcs',
  stock: '',
  purchasePrice: '',
  lowStockThreshold: '',
  isActive: true,
};

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

function SearchableSupplierField({ suppliers, value, onChange, placeholder = 'Search supplier by name or phone' }) {
  const listId = useId();
  const getOptionLabel = (supplier) => `${supplier.name}${supplier.phone ? ` - ${supplier.phone}` : ''}`;
  const [query, setQuery] = useState('');

  useEffect(() => {
    const selectedSupplier = suppliers.find((supplier) => supplier._id === value);
    setQuery(selectedSupplier ? getOptionLabel(selectedSupplier) : '');
  }, [suppliers, value]);

  const handleChange = (event) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);

    const exactMatch = suppliers.find((supplier) => getOptionLabel(supplier) === nextQuery);
    if (exactMatch) {
      onChange(exactMatch._id);
      return;
    }

    if (!nextQuery.trim()) {
      onChange('');
    }
  };

  return (
    <div>
      <input
        list={listId}
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="input-field"
      />
      <datalist id={listId}>
        {suppliers.map((supplier) => (
          <option key={supplier._id} value={getOptionLabel(supplier)} />
        ))}
      </datalist>
    </div>
  );
}

function SearchableOptionField({ options, value, onChange, placeholder = 'Search option' }) {
  const listId = useId();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const selectedOption = options.find((option) => option.value === value);
    setQuery(selectedOption ? selectedOption.label : '');
  }, [options, value]);

  const handleChange = (event) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);

    const exactMatch = options.find((option) => option.label === nextQuery);
    if (exactMatch) {
      onChange(exactMatch.value);
      return;
    }

    if (!nextQuery.trim()) {
      onChange('');
    }
  };

  return (
    <div>
      <input
        list={listId}
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="input-field"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </div>
  );
}

export function AdminSuppliers() {
  const formRef = useRef(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editSupplier, setEditSupplier] = useState(null);
  const [form, setForm] = useState(supplierFormDefaults);
  const [saving, setSaving] = useState(false);
  const [listFilters, setListFilters] = useState({ search: '', status: '', sortBy: 'name-asc', page: 1, pageSize: 5 });

  const fetchSuppliers = () => {
    setLoading(true);
    api.get('/suppliers').then((r) => setSuppliers(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = 'Suppliers - Admin';
    fetchSuppliers();
  }, []);

  const openEdit = (supplier = null) => {
    setEditSupplier(supplier);
    setForm(supplier ? {
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      isActive: supplier.isActive ?? true,
    } : supplierFormDefaults);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const resetForm = () => {
    setEditSupplier(null);
    setForm(supplierFormDefaults);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editSupplier) await api.put(`/suppliers/${editSupplier._id}`, form);
      else await api.post('/suppliers', form);
      toast.success(editSupplier ? 'Supplier updated' : 'Supplier created');
      resetForm();
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted');
      fetchSuppliers();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleStatusToggle = async (supplier) => {
    try {
      await api.put(`/suppliers/${supplier._id}`, { isActive: !supplier.isActive });
      toast.success(`Supplier ${supplier.isActive ? 'deactivated' : 'activated'}`);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const query = listFilters.search.toLowerCase();
    const matchesSearch = !query || [supplier.name, supplier.phone, supplier.email, supplier.contactPerson].some((value) => String(value || '').toLowerCase().includes(query));
    const matchesStatus = !listFilters.status || String(supplier.isActive) === listFilters.status;
    return matchesSearch && matchesStatus;
  });

  const sortedSuppliers = sortItems(filteredSuppliers, listFilters.sortBy, {
    name: (supplier) => supplier.name,
    mobile: (supplier) => supplier.phone,
    status: (supplier) => (supplier.isActive ? 'active' : 'inactive'),
  });

  const supplierTotalPages = Math.max(1, Math.ceil(sortedSuppliers.length / listFilters.pageSize));
  const supplierCurrentPage = Math.min(listFilters.page, supplierTotalPages);
  const paginatedSuppliers = sortedSuppliers.slice((supplierCurrentPage - 1) * listFilters.pageSize, supplierCurrentPage * listFilters.pageSize);

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Supplier Management</h1>
        <p className="mt-1 text-sm text-gray-500">Create and manage supplier details from one place.</p>
      </div>

      <div ref={formRef} className="admin-card mb-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <FiTruck size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
            <p className="text-sm text-gray-500">Enter supplier details below.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Supplier Name *" className="input-field" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Mobile Number *" className="input-field" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input-field" />
          <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Contact Person" className="input-field" />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="input-field xl:col-span-2" />
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="input-field xl:col-span-2" />
          <div className="xl:col-span-4 flex flex-wrap items-center justify-end gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary min-w-[160px]">
              {saving ? 'Saving...' : editSupplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
            {editSupplier ? (
              <button onClick={resetForm} className="btn-outline">
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <EmptyState icon={<FiTruck size={56} />} title="No suppliers yet" />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Supplier List</h2>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              Total: {suppliers.length}
            </div>
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
            <div className="relative w-full max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input value={listFilters.search} onChange={(e) => setListFilters({ ...listFilters, search: e.target.value, page: 1 })} placeholder="Search suppliers..." className="input-field h-11 py-2 pl-10 text-sm" />
            </div>
            <select value={listFilters.status} onChange={(e) => setListFilters({ ...listFilters, status: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[180px] py-2 text-sm">
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select value={listFilters.sortBy} onChange={(e) => setListFilters({ ...listFilters, sortBy: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[180px] py-2 text-sm">
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="mobile-asc">Mobile A-Z</option>
              <option value="mobile-desc">Mobile Z-A</option>
              <option value="status-asc">Status A-Z</option>
              <option value="status-desc">Status Z-A</option>
            </select>
            <select value={listFilters.pageSize} onChange={(e) => setListFilters({ ...listFilters, pageSize: Number(e.target.value), page: 1 })} className="input-field h-11 w-full max-w-[130px] py-2 text-sm">
              {[5, 10, 20].map((size) => <option key={size} value={size}>{size} / page</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs text-gray-500">
                  {['#', 'Name', 'Mobile', 'Email', 'Contact Person', 'Address', 'Status', 'Action'].map((head) => (
                    <th key={head} className="px-4 py-3 font-medium">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedSuppliers.map((supplier, index) => (
                  <tr key={supplier._id} className="hover:bg-brand-50/40">
                    <td className="px-4 py-3 text-gray-500">{(supplierCurrentPage - 1) * listFilters.pageSize + index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{supplier.name}</td>
                    <td className="px-4 py-3 text-gray-700">{supplier.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{supplier.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{supplier.contactPerson || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{supplier.address || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={supplier.isActive ? 'badge badge-green' : 'badge badge-red'}>
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(supplier)} className="text-sm font-medium text-brand-500 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => handleStatusToggle(supplier)} className="text-sm font-medium text-amber-600 hover:underline">
                          {supplier.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDelete(supplier._id)} className="text-sm font-medium text-red-500 hover:underline">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={supplierCurrentPage} totalPages={supplierTotalPages} onPageChange={(page) => setListFilters({ ...listFilters, page })} />
        </div>
      )}
    </div>
  );
}

export function AdminRawMaterials() {
  const formRef = useRef(null);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);
  const [editMaterial, setEditMaterial] = useState(null);
  const [form, setForm] = useState(rawMaterialFormDefaults);
  const [createItems, setCreateItems] = useState([{ ...rawMaterialItemDefaults }]);
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    note: '',
    items: [{ rawMaterialId: '', quantity: '', purchasePrice: '' }],
  });
  const [saving, setSaving] = useState(false);
  const [listFilters, setListFilters] = useState({ search: '', status: '', sortBy: 'name-asc', page: 1, pageSize: 5 });
  const rawMaterialOptions = rawMaterials.map((material) => ({
    value: material._id,
    label: `${material.name}${material.unit ? ` (${material.unit})` : ''}`,
  }));

  const fetchAll = async () => {
    setLoading(true);
    const [materialsRes, suppliersRes] = await Promise.all([api.get('/raw-materials'), api.get('/suppliers')]);
    setRawMaterials(materialsRes.data.data);
    setSuppliers(suppliersRes.data.data);
    setLoading(false);
  };

  useEffect(() => {
    document.title = 'Raw Materials - Admin';
    fetchAll();
  }, []);

  const openEdit = (material = null) => {
    setEditMaterial(material);
    setForm(material ? {
      supplier: material.supplier?._id || '',
      name: material.name || '',
      unit: material.unit || 'pcs',
      stock: material.stock || 0,
      purchasePrice: material.purchasePrice || 0,
      lowStockThreshold: material.lowStockThreshold || 0,
      isActive: material.isActive ?? true,
    } : rawMaterialFormDefaults);
    setCreateItems([{ ...rawMaterialItemDefaults }]);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const resetForm = () => {
    setEditMaterial(null);
    setForm(rawMaterialFormDefaults);
    setCreateItems([{ ...rawMaterialItemDefaults }]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editMaterial) await api.put(`/raw-materials/${editMaterial._id}`, form);
      else await api.post('/raw-materials', {
        supplier: form.supplier,
        items: createItems.filter((item) => item.name.trim()),
      });
      toast.success(editMaterial ? 'Raw material updated' : 'Raw materials created');
      resetForm();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save raw material');
    } finally {
      setSaving(false);
    }
  };

  const handlePurchase = async () => {
    setSaving(true);
    try {
      await api.post('/raw-materials/purchase', {
        supplierId: purchaseForm.supplierId,
        note: purchaseForm.note,
        items: purchaseForm.items.filter((item) => item.rawMaterialId && item.quantity && item.purchasePrice !== ''),
      });
      toast.success('Raw materials purchased');
      setShowPurchase(false);
      setPurchaseForm({
        supplierId: '',
        note: '',
        items: [{ rawMaterialId: '', quantity: '', purchasePrice: '' }],
      });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this raw material?')) return;
    try {
      await api.delete(`/raw-materials/${id}`);
      toast.success('Raw material deleted');
      fetchAll();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleStatusToggle = async (material) => {
    try {
      await api.put(`/raw-materials/${material._id}`, { isActive: !material.isActive });
      toast.success(`Raw material ${material.isActive ? 'deactivated' : 'activated'}`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const addPurchaseItem = () => {
    setPurchaseForm({
      ...purchaseForm,
      items: [...purchaseForm.items, { rawMaterialId: '', quantity: '', purchasePrice: '' }],
    });
  };

  const updatePurchaseItem = (index, key, value) => {
    const next = [...purchaseForm.items];
    next[index][key] = value;
    setPurchaseForm({ ...purchaseForm, items: next });
  };

  const removePurchaseItem = (index) => {
    setPurchaseForm({
      ...purchaseForm,
      items: purchaseForm.items.filter((_, i) => i !== index),
    });
  };

  const addCreateItem = () => {
    setCreateItems([...createItems, { ...rawMaterialItemDefaults }]);
  };

  const updateCreateItem = (index, key, value) => {
    const next = [...createItems];
    next[index][key] = value;
    setCreateItems(next);
  };

  const removeCreateItem = (index) => {
    setCreateItems(createItems.filter((_, i) => i !== index));
  };

  const filteredMaterials = rawMaterials.filter((material) => {
    const query = listFilters.search.toLowerCase();
    const matchesSearch = !query || [material.name, material.supplier?.name, material.unit].some((value) => String(value || '').toLowerCase().includes(query));
    const matchesStatus = !listFilters.status || String(material.isActive) === listFilters.status;
    return matchesSearch && matchesStatus;
  });

  const sortedMaterials = sortItems(filteredMaterials, listFilters.sortBy, {
    name: (material) => material.name,
    supplier: (material) => material.supplier?.name,
    stock: (material) => material.stock,
    status: (material) => (material.isActive ? 'active' : 'inactive'),
  });

  const materialTotalPages = Math.max(1, Math.ceil(sortedMaterials.length / listFilters.pageSize));
  const materialCurrentPage = Math.min(listFilters.page, materialTotalPages);
  const paginatedMaterials = sortedMaterials.slice((materialCurrentPage - 1) * listFilters.pageSize, materialCurrentPage * listFilters.pageSize);

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Raw Material Management</h1>
          <p className="mt-1 text-sm text-gray-500">Create raw materials, manage suppliers, and keep purchase-ready stock records.</p>
        </div>
        <button onClick={() => setShowPurchase(true)} className="btn-outline flex items-center gap-2"><FiShoppingCart size={16} /> Buy Material</button>
      </div>

      <div ref={formRef} className="admin-card mb-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <FiBox size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{editMaterial ? 'Edit Raw Material' : 'Add Raw Material'}</h2>
            <p className="text-sm text-gray-500">
              {editMaterial ? 'Update one raw material record.' : 'Add one or many raw materials in a single form.'}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="max-w-md">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Supplier</label>
            <SearchableSupplierField
              suppliers={suppliers}
              value={form.supplier}
              onChange={(supplierId) => setForm({ ...form, supplier: supplierId })}
            />
          </div>

          {editMaterial ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Raw material name" className="input-field xl:col-span-2" />
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field">
                {['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'pack', 'set', 'roll'].map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Opening stock" className="input-field" />
              <input type="number" min="0" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="Purchase price per unit" className="input-field" />
              <input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} placeholder="Low stock alert level" className="input-field" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">Raw Material Items</p>
                <p className="text-xs text-gray-500">Create multiple items together with stock and pricing details.</p>
              </div>
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
                {createItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 items-center gap-3 xl:grid-cols-[minmax(0,2.2fr)_140px_140px_160px_160px_auto]">
                    <input
                      value={item.name}
                      onChange={(e) => updateCreateItem(index, 'name', e.target.value)}
                      placeholder="Raw material"
                      className="input-field"
                    />
                    <select value={item.unit} onChange={(e) => updateCreateItem(index, 'unit', e.target.value)} className="input-field">
                      {['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'pack', 'set', 'roll'].map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={item.stock}
                      onChange={(e) => updateCreateItem(index, 'stock', e.target.value)}
                      placeholder="Qty"
                      className="input-field"
                    />
                    <input
                      type="number"
                      min="0"
                      value={item.purchasePrice}
                      onChange={(e) => updateCreateItem(index, 'purchasePrice', e.target.value)}
                      placeholder="Price"
                      className="input-field"
                    />
                    <input
                      type="number"
                      min="0"
                      value={item.lowStockThreshold}
                      onChange={(e) => updateCreateItem(index, 'lowStockThreshold', e.target.value)}
                      placeholder="Low stock alert"
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={() => removeCreateItem(index)}
                      disabled={createItems.length === 1}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
                <div className="flex justify-start border-t border-gray-100 pt-3">
                  <button type="button" onClick={addCreateItem} className="text-sm font-medium text-brand-500 hover:underline">
                    + Add Row
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary min-w-[170px]">
              {saving ? 'Saving...' : editMaterial ? 'Update Raw Material' : 'Add Raw Materials'}
            </button>
            {(editMaterial || createItems.length > 1 || createItems[0].name || createItems[0].stock || createItems[0].purchasePrice || createItems[0].lowStockThreshold || form.supplier) ? (
              <button onClick={resetForm} className="btn-outline">
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {rawMaterials.length === 0 ? (
        <EmptyState icon={<FiBox size={56} />} title="No raw materials yet" />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Raw Material List</h2>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              Total: {rawMaterials.length}
            </div>
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
            <div className="relative w-full max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input value={listFilters.search} onChange={(e) => setListFilters({ ...listFilters, search: e.target.value, page: 1 })} placeholder="Search raw materials..." className="input-field h-11 py-2 pl-10 text-sm" />
            </div>
            <select value={listFilters.status} onChange={(e) => setListFilters({ ...listFilters, status: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[180px] py-2 text-sm">
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select value={listFilters.sortBy} onChange={(e) => setListFilters({ ...listFilters, sortBy: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[180px] py-2 text-sm">
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="supplier-asc">Supplier A-Z</option>
              <option value="supplier-desc">Supplier Z-A</option>
              <option value="stock-asc">Stock Low-High</option>
              <option value="stock-desc">Stock High-Low</option>
            </select>
            <select value={listFilters.pageSize} onChange={(e) => setListFilters({ ...listFilters, pageSize: Number(e.target.value), page: 1 })} className="input-field h-11 w-full max-w-[130px] py-2 text-sm">
              {[5, 10, 20].map((size) => <option key={size} value={size}>{size} / page</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs text-gray-500">
                  {['#', 'Material', 'Supplier', 'Unit', 'Stock', 'Purchase Price', 'Status', 'Action'].map((head) => (
                    <th key={head} className="px-4 py-3 font-medium">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedMaterials.map((material, index) => (
                  <tr key={material._id} className="hover:bg-brand-50/40">
                    <td className="px-4 py-3 text-gray-500">{(materialCurrentPage - 1) * listFilters.pageSize + index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{material.name}</td>
                    <td className="px-4 py-3 text-gray-700">{material.supplier?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{material.unit}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{material.stock}</td>
                    <td className="px-4 py-3 text-gray-700">Rs.{material.purchasePrice}</td>
                    <td className="px-4 py-3">
                      <span className={material.isActive ? 'badge badge-green' : 'badge badge-red'}>{material.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(material)} className="text-sm font-medium text-brand-500 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => handleStatusToggle(material)} className="text-sm font-medium text-amber-600 hover:underline">
                          {material.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDelete(material._id)} className="text-sm font-medium text-red-500 hover:underline">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={materialCurrentPage} totalPages={materialTotalPages} onPageChange={(page) => setListFilters({ ...listFilters, page })} />
        </div>
      )}

      <Modal isOpen={showPurchase} onClose={() => setShowPurchase(false)} title="Buy Raw Materials" size="lg">
        <div className="space-y-4">
          <div className="max-w-sm">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Supplier</label>
            <SearchableSupplierField
              suppliers={suppliers}
              value={purchaseForm.supplierId}
              onChange={(supplierId) => setPurchaseForm({ ...purchaseForm, supplierId })}
              placeholder="Search supplier by name or phone"
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Purchase Items</p>
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
              {purchaseForm.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1.8fr)_140px_160px_auto]">
                  <SearchableOptionField
                    options={rawMaterialOptions}
                    value={item.rawMaterialId}
                    onChange={(selectedId) => updatePurchaseItem(index, 'rawMaterialId', selectedId)}
                    placeholder="Search raw material"
                  />
                  <input type="number" min="0" value={item.quantity} onChange={(e) => updatePurchaseItem(index, 'quantity', e.target.value)} placeholder="Qty" className="input-field" />
                  <input type="number" min="0" value={item.purchasePrice} onChange={(e) => updatePurchaseItem(index, 'purchasePrice', e.target.value)} placeholder="Price" className="input-field" />
                  <button
                    type="button"
                    onClick={() => removePurchaseItem(index)}
                    disabled={purchaseForm.items.length === 1}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="flex justify-start border-t border-gray-100 pt-3">
                <button type="button" onClick={addPurchaseItem} className="text-sm font-medium text-brand-500 hover:underline">
                  + Add Row
                </button>
              </div>
            </div>
          </div>
          <input value={purchaseForm.note} onChange={(e) => setPurchaseForm({ ...purchaseForm, note: e.target.value })} placeholder="Purchase note" className="input-field" />
          <div className="flex gap-3">
            <button onClick={() => setShowPurchase(false)} className="btn-outline flex-1">Cancel</button>
            <button onClick={handlePurchase} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Purchase'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function AdminProductBom() {
  const formRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProductId, setEditProductId] = useState('');
  const [bomItems, setBomItems] = useState([]);
  const [savingBom, setSavingBom] = useState(false);
  const [listFilters, setListFilters] = useState({ search: '', sortBy: 'name-asc', page: 1, pageSize: 5 });
  const productOptions = products.map((product) => ({
    value: product._id,
    label: `${product.name}${product.sku ? ` - ${product.sku}` : ''}`,
  }));
  const rawMaterialOptions = rawMaterials.map((material) => ({
    value: material._id,
    label: `${material.name}${material.unit ? ` (${material.unit})` : ''}`,
  }));

  const fetchAll = async () => {
    setLoading(true);
    const [productsRes, rawMaterialsRes] = await Promise.all([
      api.get('/products/admin/all', { params: { limit: 200 } }),
      api.get('/raw-materials'),
    ]);
    setProducts(productsRes.data.data);
    setRawMaterials(rawMaterialsRes.data.data);
    setLoading(false);
  };

  useEffect(() => {
    document.title = 'Product BOM - Admin';
    fetchAll();
  }, []);

  useEffect(() => {
    if (!editProductId) {
      setBomItems([]);
      return;
    }
    const product = products.find((item) => item._id === editProductId);
    const nextBomItems = (product?.bom || []).map((item) => ({
      rawMaterial: item.rawMaterial?._id || item.rawMaterial || '',
      quantity: item.quantity || '',
    }));
    setBomItems(nextBomItems.length ? nextBomItems : [{ rawMaterial: '', quantity: '' }]);
  }, [editProductId, products]);

  const selectedBomProduct = products.find((product) => product._id === editProductId);

  const addBomItem = () => {
    setBomItems([...bomItems, { rawMaterial: '', quantity: '' }]);
  };

  const updateBomItem = (index, key, value) => {
    const next = [...bomItems];
    next[index][key] = value;
    setBomItems(next);
  };

  const removeBomItem = (index) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  const resetBomEditor = () => {
    setEditProductId('');
    setBomItems([]);
  };

  const openBomEditor = (productId) => {
    setEditProductId(productId);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSaveBom = async () => {
    if (!editProductId) {
      toast.error('Select a product first');
      return;
    }

    setSavingBom(true);
    try {
      await api.put(`/products/${editProductId}`, {
        bom: JSON.stringify(bomItems.filter((item) => item.rawMaterial && Number(item.quantity) > 0)),
      });
      toast.success('BOM updated');
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update BOM');
    } finally {
      setSavingBom(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = listFilters.search.toLowerCase();
    return !query || [product.name, product.sku, product.category?.name].some((value) => String(value || '').toLowerCase().includes(query));
  });

  const sortedProducts = sortItems(filteredProducts, listFilters.sortBy, {
    name: (product) => product.name,
    category: (product) => product.category?.name,
    stock: (product) => Number(product.stock || 0),
    bom: (product) => product.bom?.length || 0,
  });

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / listFilters.pageSize));
  const currentPage = Math.min(listFilters.page, totalPages);
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * listFilters.pageSize, currentPage * listFilters.pageSize);

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Product BOM</h1>
        <p className="mt-1 text-sm text-gray-500">Define the raw material recipe for each finished product from one dedicated page.</p>
      </div>

        <div ref={formRef} className="admin-card mb-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <FiLayers size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{selectedBomProduct ? `Edit BOM for ${selectedBomProduct.name}` : 'BOM Editor'}</h2>
            <p className="text-sm text-gray-500">BOM is the recipe for one finished unit. Stock is deducted only when you record production.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="max-w-md">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Product</label>
            <SearchableOptionField
              options={productOptions}
              value={editProductId}
              onChange={setEditProductId}
              placeholder="Search product"
            />
          </div>

          {editProductId ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="mb-3">
                <p className="font-semibold text-gray-800">{selectedBomProduct?.name} Recipe</p>
                <p className="text-xs text-gray-500">Add each raw material and how much is needed to make one unit of this product.</p>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
                {selectedBomProduct?.bom?.length ? null : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    No BOM saved yet for this product. Start by filling the first row below.
                  </div>
                )}
                {bomItems.map((item, index) => (
                  <div key={index}>
                    <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
                      <SearchableOptionField
                        options={rawMaterialOptions}
                        value={item.rawMaterial}
                        onChange={(selectedId) => updateBomItem(index, 'rawMaterial', selectedId)}
                        placeholder="Search raw material"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateBomItem(index, 'quantity', e.target.value)}
                        placeholder="Qty per unit"
                        className="input-field"
                      />
                      <button type="button" onClick={() => removeBomItem(index)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    {item.rawMaterial ? (() => {
                      const selectedMaterial = rawMaterials.find((material) => material._id === item.rawMaterial);
                      const currentStock = Number(selectedMaterial?.stock || 0);
                      const enteredQty = Number(item.quantity) || 0;
                      const showWarning = enteredQty > currentStock;

                      return (
                        <div className="mt-3 text-xs">
                          <span className="text-gray-500">
                            Current stock: {currentStock} {selectedMaterial?.unit || ''}
                          </span>
                          {showWarning ? (
                            <span className="ml-2 text-red-500">
                              This recipe uses more than the current stock for one unit. Save is allowed, but production will stay blocked until stock increases.
                            </span>
                          ) : null}
                        </div>
                      );
                    })() : null}
                  </div>
                ))}
                <div className="flex justify-start border-t border-gray-100 pt-3">
                  <button type="button" onClick={addBomItem} className="text-sm font-medium text-brand-500 hover:underline">
                    + Add Row
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <button onClick={resetBomEditor} className="btn-outline">
                  Cancel
                </button>
                <button onClick={handleSaveBom} disabled={savingBom} className="btn-primary min-w-[160px]">
                  {savingBom ? 'Saving...' : 'Save BOM'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Select a product to manage its BOM recipe.
            </div>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState icon={<FiLayers size={56} />} title="No products available for BOM yet" />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">BOM List</h2>
              <p className="text-sm text-gray-500">Review which products are production-ready and which still need recipe setup.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              Total: {products.length}
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
            <div className="relative w-full max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={listFilters.search}
                onChange={(e) => setListFilters({ ...listFilters, search: e.target.value, page: 1 })}
                placeholder="Search products..."
                className="input-field h-11 py-2 pl-10 text-sm"
              />
            </div>
            <select value={listFilters.sortBy} onChange={(e) => setListFilters({ ...listFilters, sortBy: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[180px] py-2 text-sm">
              <option value="name-asc">Product A-Z</option>
              <option value="name-desc">Product Z-A</option>
              <option value="category-asc">Category A-Z</option>
              <option value="category-desc">Category Z-A</option>
              <option value="stock-desc">Stock High-Low</option>
              <option value="stock-asc">Stock Low-High</option>
              <option value="bom-desc">Most Materials</option>
              <option value="bom-asc">Fewest Materials</option>
            </select>
            <select value={listFilters.pageSize} onChange={(e) => setListFilters({ ...listFilters, pageSize: Number(e.target.value), page: 1 })} className="input-field h-11 w-full max-w-[130px] py-2 text-sm">
              {[5, 10, 20].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs text-gray-500">
                  {['Product', 'Category', 'BOM Summary', 'Stock', 'Actions'].map((head) => (
                    <th key={head} className="px-4 py-3 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedProducts.map((product) => (
                  <tr key={product._id} className="align-top hover:bg-brand-50/40">
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sku || 'No SKU'}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{product.category?.name || '-'}</td>
                    <td className="px-4 py-4">
                      {product.bom?.length ? (
                        <div className="space-y-2">
                          {product.bom.map((item, index) => (
                            <div key={`${product._id}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                              <span className="font-medium text-gray-900">{item.rawMaterial?.name || 'Raw material'}</span>
                              <span className="ml-2 text-gray-500">x {item.quantity} {item.rawMaterial?.unit || ''}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="badge badge-red">No BOM</span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900">{product.stock || 0}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => openBomEditor(product._id)} className="text-sm font-medium text-brand-500 hover:underline">
                        {product.bom?.length ? 'Edit BOM' : 'Add BOM'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setListFilters({ ...listFilters, page })} />
        </div>
      )}
    </div>
  );
}

export function AdminProduction() {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ productId: '', quantityProduced: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [listFilters, setListFilters] = useState({ search: '', sortBy: 'date-desc', page: 1, pageSize: 5 });
  const productOptions = products.map((product) => ({
    value: product._id,
    label: `${product.name}${product.sku ? ` - ${product.sku}` : ''}`,
  }));

  const fetchAll = async () => {
    setLoading(true);
    const [productsRes, rawMaterialsRes, batchesRes] = await Promise.all([
      api.get('/products/admin/all', { params: { limit: 200 } }),
      api.get('/raw-materials'),
      api.get('/production'),
    ]);
    setProducts(productsRes.data.data);
    setRawMaterials(rawMaterialsRes.data.data);
    setBatches(batchesRes.data.data);
    setLoading(false);
  };

  useEffect(() => {
    document.title = 'Production - Admin';
    fetchAll();
  }, []);

  const handleProduce = async () => {
    setSaving(true);
    try {
      await api.post('/production', form);
      toast.success('Production recorded');
      setShowModal(false);
      setForm({ productId: '', quantityProduced: '', note: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Production failed');
    } finally {
      setSaving(false);
    }
  };

  const selectedProductionProduct = products.find((product) => product._id === form.productId);

  const getMaxProducibleQuantity = (product) => {
    if (!product?.bom?.length) return 0;

    const capacities = product.bom.map((item) => {
      const materialId = item.rawMaterial?._id || item.rawMaterial;
      const material = rawMaterials.find((entry) => entry._id === materialId);
      const perUnitQty = Number(item.quantity) || 0;
      if (!material || perUnitQty <= 0) return 0;
      return Math.floor(Number(material.stock || 0) / perUnitQty);
    });

    return capacities.length ? Math.min(...capacities) : 0;
  };

  const productionQuantity = Number(form.quantityProduced) || 0;
  const maxProducibleQuantity = getMaxProducibleQuantity(selectedProductionProduct);
  const productionNeeds = selectedProductionProduct?.bom?.map((item) => {
    const materialId = item.rawMaterial?._id || item.rawMaterial;
    const material = rawMaterials.find((entry) => entry._id === materialId);
    const perUnitQty = Number(item.quantity) || 0;
    const requiredQty = perUnitQty * productionQuantity;

    return {
      id: materialId,
      name: item.rawMaterial?.name || material?.name || 'Raw material',
      unit: item.rawMaterial?.unit || material?.unit || '',
      available: Number(material?.stock || 0),
      required: requiredQty,
      sufficient: requiredQty <= Number(material?.stock || 0),
    };
  }) || [];

  const filteredBatches = batches.filter((batch) => {
    const query = listFilters.search.toLowerCase();
    return !query || [batch.product?.name, batch.note].some((value) => String(value || '').toLowerCase().includes(query));
  });

  const sortedBatches = [...filteredBatches].sort((a, b) => {
    if (listFilters.sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (listFilters.sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (listFilters.sortBy === 'product-asc') return String(a.product?.name || '').localeCompare(String(b.product?.name || ''));
    return String(b.product?.name || '').localeCompare(String(a.product?.name || ''));
  });

  const batchTotalPages = Math.max(1, Math.ceil(sortedBatches.length / listFilters.pageSize));
  const batchCurrentPage = Math.min(listFilters.page, batchTotalPages);
  const paginatedBatches = sortedBatches.slice((batchCurrentPage - 1) * listFilters.pageSize, batchCurrentPage * listFilters.pageSize);

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Production</h1>
          <p className="mt-1 text-sm text-gray-500">Record finished batches here after the BOM recipe has been set in the Product BOM module.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><FiTool size={16} /> Record Production</button>
      </div>

      {batches.length === 0 ? (
        <EmptyState icon={<FiLayers size={56} />} title="No production batches yet" action={<button onClick={() => setShowModal(true)} className="btn-primary">Record Production</button>} />
      ) : (
        <div className="space-y-4">
          <div className="admin-card">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full max-w-sm">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input value={listFilters.search} onChange={(e) => setListFilters({ ...listFilters, search: e.target.value, page: 1 })} placeholder="Search batches..." className="input-field h-11 py-2 pl-10 text-sm" />
              </div>
              <select value={listFilters.sortBy} onChange={(e) => setListFilters({ ...listFilters, sortBy: e.target.value, page: 1 })} className="input-field h-11 w-full max-w-[180px] py-2 text-sm">
                <option value="date-desc">Latest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="product-asc">Product A-Z</option>
                <option value="product-desc">Product Z-A</option>
              </select>
              <select value={listFilters.pageSize} onChange={(e) => setListFilters({ ...listFilters, pageSize: Number(e.target.value), page: 1 })} className="input-field h-11 w-full max-w-[130px] py-2 text-sm">
                {[5, 10, 20].map((size) => <option key={size} value={size}>{size} / page</option>)}
              </select>
            </div>
          </div>
          {paginatedBatches.map((batch) => (
            <div key={batch._id} className="admin-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-900">
                    <FiPackage size={18} className="text-brand-500" />
                    <p className="font-semibold">{batch.product?.name}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Produced {batch.quantityProduced} units on {new Date(batch.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <span className="badge badge-blue">{batch.materialsUsed.length} materials used</span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {batch.materialsUsed.map((item, index) => (
                  <div key={`${batch._id}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                    <p className="font-medium text-gray-900">{item.rawMaterial?.name}</p>
                    <p>Per unit: {item.quantityPerUnit} {item.unit}</p>
                    <p>Total used: {item.quantityUsed} {item.unit}</p>
                  </div>
                ))}
              </div>

              {batch.note ? <p className="mt-4 text-sm text-gray-500">{batch.note}</p> : null}
            </div>
          ))}
          <Pagination currentPage={batchCurrentPage} totalPages={batchTotalPages} onPageChange={(page) => setListFilters({ ...listFilters, page })} />
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Production">
        <div className="space-y-4">
          <SearchableOptionField
            options={productOptions}
            value={form.productId}
            onChange={(productId) => setForm({ ...form, productId })}
            placeholder="Search product"
          />
          <input type="number" min="1" value={form.quantityProduced} onChange={(e) => setForm({ ...form, quantityProduced: e.target.value })} placeholder="Quantity to produce" className="input-field" />
          <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} placeholder="Production note" className="input-field resize-none" />
          {selectedProductionProduct ? (
            <div className="space-y-3 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
              <p>Record Production means you are adding finished product stock after making the item. The system will automatically deduct the linked BOM raw materials at the same time.</p>
              {!selectedProductionProduct.bom?.length ? (
                <p className="text-red-500">This product has no BOM. Add the recipe first in the Product BOM page.</p>
              ) : (
                <>
                  <p className="font-medium text-gray-800">Maximum producible with current raw material stock: {maxProducibleQuantity}</p>
                  {productionQuantity > 0 ? (
                    <div className="space-y-2 rounded-xl bg-white/80 p-3 text-gray-700">
                      {productionNeeds.map((item) => (
                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span>{item.name}</span>
                          <span className={item.sufficient ? 'text-gray-600' : 'text-red-500'}>
                            Need {item.required} {item.unit} | Available {item.available} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
              Record Production increases finished product stock and deducts the linked BOM raw materials automatically.
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
            <button
              onClick={handleProduce}
              disabled={saving || !selectedProductionProduct?.bom?.length || (productionQuantity > 0 && productionQuantity > maxProducibleQuantity)}
              className="btn-primary flex-1"
            >
              {saving ? 'Saving...' : 'Save Production'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
