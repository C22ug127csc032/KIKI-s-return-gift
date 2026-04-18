import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPackage, FiSearch, FiShoppingBag, FiTruck, FiX } from 'react-icons/fi';
import api from '../../api/api.js';
import { EmptyState, PageLoader, Pagination } from '../../components/ui/index.jsx';
import FloatingField from '../../components/forms/FloatingField.jsx';

const getFieldLabel = (placeholder = '') => String(placeholder || '').replace(/\*/g, '').trim();

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

  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={fieldRef} className="relative">
      <FloatingField
        value={query}
        onChange={(event) => {
          if (disabled) return;
          setQuery(event.target.value);
          setOpen(true);
          if (!event.target.value.trim()) onChange('');
        }}
        onFocus={() => !disabled && setOpen(true)}
        label={getFieldLabel(placeholder)}
        disabled={disabled}
        className={disabled ? 'pr-12 cursor-not-allowed bg-gray-100 text-gray-400' : 'pr-12'}
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            onChange('');
            setOpen(false);
          }}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 hover:text-rose-500"
        >
          <FiX size={15} />
        </button>
      ) : null}

      {open && !disabled ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-20 max-h-56 overflow-y-auto rounded-2xl border border-rose-100 bg-white p-2 shadow-[0_18px_40px_rgba(225,29,72,0.16)]">
          {filteredOptions.length ? filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setQuery(option.label);
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                value === option.value ? 'bg-rose-100 text-rose-700' : 'text-gray-700 hover:bg-rose-50 hover:text-rose-600'
              }`}
            >
              {option.label}
            </button>
          )) : (
            <div className="px-3 py-3 text-sm text-gray-400">No matching options found.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

const formDefaults = {
  supplierId: '',
  productName: '',
  quantity: '',
  purchasePrice: '',
  invoiceNumber: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  note: '',
};

export default function AdminProductPurchases() {
  const formRef = useRef(null);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(formDefaults);
  const [filters, setFilters] = useState({ search: '', page: 1, limit: 10 });
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  const supplierOptions = useMemo(() => suppliers.filter((item) => item.isActive !== false).map((supplier) => ({
    value: supplier._id,
    label: `${supplier.name}${supplier.phone ? ` - ${supplier.phone}` : ''}`,
  })), [suppliers]);

  const fetchPurchases = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const response = await api.get('/product-purchases', { params: nextFilters });
      setPurchases(response.data.data);
      setMeta(response.data.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Product Purchases - Admin';
    Promise.all([
      api.get('/suppliers'),
    ]).then(([suppliersRes]) => {
      setSuppliers(suppliersRes.data.data || []);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchPurchases(filters);
  }, [filters.search, filters.page, filters.limit]);

  const totalAmount = Math.round(Number(form.quantity || 0) * Number(form.purchasePrice || 0));

  const handleSave = async () => {
    if (!form.supplierId || !form.productName.trim()) {
      toast.error('Supplier and product name are required');
      return;
    }
    if (!Number(form.quantity) || Number(form.quantity) <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    if (Number(form.purchasePrice) < 0 || Number.isNaN(Number(form.purchasePrice))) {
      toast.error('Enter a valid purchase rate');
      return;
    }

    setSaving(true);
    try {
      await api.post('/product-purchases', form);
      toast.success('Product purchase recorded');
      setForm(formDefaults);
      fetchPurchases({ ...filters, page: 1 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record purchase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Product Purchases</h1>
        <p className="mt-1 text-sm text-gray-500">Buy stock from suppliers for products that already exist in your catalog.</p>
      </div>

      <div ref={formRef} className="admin-card mb-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <FiTruck size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Record Purchase</h2>
            <p className="text-sm text-gray-500">Buy the new product first from a supplier. After this, it can be selected from the product module dropdown.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <SearchableSelectField
            options={supplierOptions}
            value={form.supplierId}
            onChange={(supplierId) => setForm({ ...form, supplierId })}
            placeholder="Search supplier *"
            disabled={!supplierOptions.length}
          />
          <FloatingField label="Bought Product Name" value={form.productName} onChange={(event) => setForm({ ...form, productName: event.target.value })} required />
          <FloatingField type="number" label="Quantity" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
          <FloatingField type="number" label="Buy Rate" min="0" step="0.01" value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: event.target.value })} required />
          <FloatingField label="Invoice Number" value={form.invoiceNumber} onChange={(event) => setForm({ ...form, invoiceNumber: event.target.value })} />
          <FloatingField type="date" label="Purchase Date" value={form.purchaseDate} onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })} />
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Total: Rs.{totalAmount}
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            This bought product will appear in the product module dropdown after saving.
          </div>
          <FloatingField as="textarea" label="Purchase Note" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} rows={3} className="resize-none xl:col-span-4" wrapperClassName="xl:col-span-4" />
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button onClick={() => setForm(formDefaults)} className="btn-outline">Clear</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary min-w-[180px]">
            {saving ? 'Saving...' : 'Record Purchase'}
          </button>
        </div>
      </div>

      {loading ? <PageLoader /> : purchases.length === 0 ? (
        <EmptyState icon={<FiShoppingBag size={56} />} title="No product purchases yet" />
      ) : (
        <>
          <div className="admin-card overflow-hidden">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Purchase History</h2>
                <p className="mt-1 text-sm text-gray-500">These bought products show the remaining quantity available to move into the product module.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                Total: {meta.total || purchases.length}
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <div className="relative w-full max-w-sm">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  value={filters.search}
                  onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })}
                  placeholder="Search supplier, product or invoice..."
                  className="input-field h-11 py-2 pl-10 text-sm"
                />
              </div>
              <select value={filters.limit} onChange={(event) => setFilters({ ...filters, limit: Number(event.target.value), page: 1 })} className="input-field h-11 w-full max-w-[130px] py-2 text-sm">
                {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs text-gray-500">
                    {['#', 'Date', 'Supplier', 'Bought Product', 'Remaining Qty', 'Rate', 'Total', 'Invoice', 'Status', 'By'].map((head) => (
                      <th key={head} className="px-4 py-3 font-medium">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {purchases.map((purchase, index) => (
                    <tr key={purchase._id} className="hover:bg-brand-50/40">
                      <td className="px-4 py-3 text-gray-500">{(meta.page - 1) * meta.limit + index + 1}</td>
                      <td className="px-4 py-3 text-gray-700">{new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-gray-700">{purchase.supplier?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{purchase.productName || '-'}</div>
                        {purchase.linkedProduct?.sku ? <div className="text-xs text-gray-400">{purchase.linkedProduct.sku}</div> : null}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{purchase.quantity}</td>
                      <td className="px-4 py-3 text-gray-700">Rs.{Math.round(Number(purchase.purchasePrice || 0))}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">Rs.{Math.round(Number(purchase.totalAmount || 0))}</td>
                      <td className="px-4 py-3 text-gray-700">{purchase.invoiceNumber || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={purchase.quantity > 0 ? 'badge badge-yellow' : 'badge badge-green'}>
                          {purchase.quantity > 0 ? 'Available' : 'Used'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{purchase.createdBy?.name || '-'}</td>
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
