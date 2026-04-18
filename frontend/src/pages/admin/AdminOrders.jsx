import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSearch, FiDownload, FiChevronDown, FiChevronUp, FiEdit, FiClipboard } from 'react-icons/fi';
import api from '../../api/api.js';
import { Badge, Pagination, PageLoader, EmptyState, Modal } from '../../components/ui/index.jsx';
import { downloadInvoiceFile, showInvoiceDownloadError } from '../../utils/invoiceDownload.js';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
const PAYMENT_OPTIONS = ['Pending', 'Paid', 'Refunded'];
const orderHasStockIssue = (order) => order.hasStockIssue || order.items?.some((item) => item.hasStockIssue || Number(item.backorderQuantity || 0) > 0);

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', orderStatus: '', paymentStatus: '', source: '', sortBy: 'latest', page: 1, limit: 10 });
  const [expandedId, setExpandedId] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = 'Orders - Admin'; }, []);

  const fetchOrders = () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
    api.get('/orders', { params }).then((response) => {
      setOrders(response.data.data);
      setMeta(response.data.meta);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filters]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/orders/${editOrder._id}/status`, editForm);
      toast.success('Order updated');
      setEditOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const downloadInvoice = async (orderId, invoiceCode) => {
    try {
      const res = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
      downloadInvoiceFile(res.data, invoiceCode);
    } catch (err) {
      await showInvoiceDownloadError(err);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Orders</h1>
      </div>

      <div className="admin-card mb-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="text-sm text-gray-500">Total: {meta.total || orders.length}</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-48 flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              placeholder="Search by order #, name, phone..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="input-field pl-10 text-sm py-2.5"
            />
          </div>
          <select value={filters.orderStatus} onChange={(e) => setFilters({ ...filters, orderStatus: e.target.value, page: 1 })} className="input-field text-sm py-2.5 w-auto">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value, page: 1 })} className="input-field text-sm py-2.5 w-auto">
            <option value="">All Payments</option>
            {PAYMENT_OPTIONS.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value, page: 1 })} className="input-field text-sm py-2.5 w-auto">
            <option value="">All Sources</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="offline">Offline</option>
          </select>
          <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value, page: 1 })} className="input-field text-sm py-2.5 w-auto">
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="total-desc">Highest Total</option>
            <option value="total-asc">Lowest Total</option>
            <option value="customer-asc">Customer A-Z</option>
            <option value="customer-desc">Customer Z-A</option>
          </select>
          <select value={filters.limit} onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value), page: 1 })} className="input-field text-sm py-2.5 w-auto">
            {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}
          </select>
        </div>
      </div>

      {loading ? <PageLoader /> : orders.length === 0 ? (
        <EmptyState icon={<FiClipboard size={56} />} title="No orders found" message="Orders will appear here once customers start placing them." />
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <motion.div
                key={order._id}
                layout
                className={`admin-card overflow-hidden ${orderHasStockIssue(order) ? 'border-amber-200 bg-amber-50/50' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-gray-800">{order.invoiceNumber || order.orderNumber}</span>
                      <Badge status={order.orderStatus} label="Order" />
                      <Badge status={order.paymentStatus} type="payment" label="Payment" />
                      {order.source === 'offline' && <span className="badge badge-blue">Offline</span>}
                      {orderHasStockIssue(order) ? <span className="badge badge-red">Stock Attention Needed</span> : null}
                    </div>
                    <p className="text-sm text-gray-600">{order.customerName} · {order.customerPhone}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('en-IN')} · ₹{order.totalAmount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditOrder(order);
                        setEditForm({ orderStatus: order.orderStatus, paymentStatus: order.paymentStatus, adminNotes: order.adminNotes || '' });
                      }}
                      className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => downloadInvoice(order._id, order.invoiceNumber || order.orderNumber)}
                      className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <FiDownload size={16} />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                    >
                      {expandedId === order._id ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {expandedId === order._id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="border-t border-gray-100 pt-4 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Order Items</p>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className={`flex justify-between rounded-lg px-2 py-1.5 text-sm ${item.hasStockIssue || Number(item.backorderQuantity || 0) > 0 ? 'bg-amber-100 text-amber-800' : ''}`}
                          >
                            <span className="text-gray-700">
                              {item.name} x{item.quantity}
                              {item.hasStockIssue || Number(item.backorderQuantity || 0) > 0 ? ` (${item.backorderQuantity || item.quantity} awaiting confirmation)` : ''}
                            </span>
                            <span className="font-medium">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t pt-1 flex justify-between font-bold text-sm">
                          <span>Total</span><span className="text-brand-600">₹{order.totalAmount}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer Details</p>
                      <p><span className="text-gray-500">Phone:</span> {order.customerPhone}</p>
                      <p><span className="text-gray-500">Address:</span> {order.customerAddress}</p>
                      {order.customerNotes && <p><span className="text-gray-500">Notes:</span> {order.customerNotes}</p>}
                      {order.adminNotes && <p><span className="text-gray-500">Admin Note:</span> {order.adminNotes}</p>}
                      {order.paymentScreenshot && (
                        <a href={order.paymentScreenshot} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline text-xs">
                          View Payment Screenshot →
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
          <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={(page) => setFilters({ ...filters, page })} />
        </>
      )}

      <Modal isOpen={!!editOrder} onClose={() => setEditOrder(null)} title={`Update Order: ${editOrder?.invoiceNumber || editOrder?.orderNumber}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Status</label>
            <select value={editForm.orderStatus} onChange={(e) => setEditForm({ ...editForm, orderStatus: e.target.value })} className="input-field">
              {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status</label>
            <select value={editForm.paymentStatus} onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })} className="input-field">
              {PAYMENT_OPTIONS.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Notes</label>
            <textarea value={editForm.adminNotes} onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })} className="input-field resize-none" rows={3} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditOrder(null)} className="btn-outline flex-1">Cancel</button>
            <button onClick={handleUpdate} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Update Order'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
