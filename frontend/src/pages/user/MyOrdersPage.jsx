import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiDownload, FiChevronDown, FiChevronUp, FiClock } from 'react-icons/fi';
import { RiGiftLine } from 'react-icons/ri';
import api from '../../api/api.js';
import { PageLoader, EmptyState, Badge, Pagination } from '../../components/ui/index.jsx';
import { downloadInvoiceFile, showInvoiceDownloadError } from '../../utils/invoiceDownload.js';

const INVOICE_READY_STATUSES = ['Shipped', 'Completed'];
const isInvoiceReady = (order) => INVOICE_READY_STATUSES.includes(order?.orderStatus);

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { document.title = "My Orders – KIKI'S Store"; }, []);

  const fetchOrders = (page = 1) => {
    setLoading(true);
    api.get(`/orders/my?page=${page}&limit=10`).then((r) => {
      setOrders(r.data.data);
      setMeta(r.data.meta);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const downloadInvoice = async (orderId) => {
    const order = orders.find((item) => item._id === orderId);
    const invoiceCode = order?.invoiceNumber || order?.orderNumber || orderId;
    try {
      const res = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
      downloadInvoiceFile(res.data, invoiceCode);
    } catch (err) {
      await showInvoiceDownloadError(err);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="page-container max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <EmptyState icon={<FiPackage size={48} />} title="No orders yet"
            message="Place your first order and it will appear here."
            action={<Link to="/shop" className="btn-primary">Start Shopping</Link>} />
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order) => (
                <motion.div key={order._id} layout
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiPackage size={14} className="text-rose-600" />
                        </div>
                        <span className="font-bold text-gray-800 text-sm font-mono">{order.invoiceNumber || order.orderNumber}</span>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5 ml-9">
                        <FiClock size={11} />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        <span className="text-gray-300">·</span>
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        <span className="text-gray-300">·</span>
                        <span className="font-bold text-gray-600">₹{order.totalAmount}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <Badge status={order.orderStatus} label="Order" />
                      <Badge status={order.paymentStatus} type="payment" label="Payment" />
                      <button
                        onClick={() => downloadInvoice(order._id)}
                        disabled={!isInvoiceReady(order)}
                        className={`p-2 rounded-lg transition-colors ${
                          isInvoiceReady(order)
                            ? 'text-gray-300 hover:text-rose-600 hover:bg-rose-50'
                            : 'cursor-not-allowed text-gray-200 bg-gray-50'
                        }`}
                        title={isInvoiceReady(order) ? 'Download Invoice' : 'Invoice available after shipping'}
                        aria-label={isInvoiceReady(order) ? 'Download Invoice' : 'Invoice available after shipping'}
                      >
                        <FiDownload size={15} />
                      </button>
                      <button onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        {expandedId === order._id ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === order._id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 overflow-hidden">
                        <div className="p-5 bg-gray-50/50">
                          <div className="space-y-2.5 mb-4">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-white rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0">
                                    <RiGiftLine size={14} className="text-rose-300" />
                                  </div>
                                  <span className="text-gray-700 font-medium">{item.name}</span>
                                  <span className="text-gray-400 text-xs">×{item.quantity}</span>
                                </div>
                                <span className="font-bold text-gray-800">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                            <div className="border-t border-gray-200 pt-2.5 flex justify-between font-bold text-sm">
                              <span className="text-gray-700">Total</span>
                              <span className="text-rose-600">₹{order.totalAmount}</span>
                            </div>
                          </div>
                          {order.customerAddress && (
                            <div className="text-xs text-gray-400 space-y-1 bg-white rounded-xl p-3 border border-gray-100">
                              <p className="font-semibold text-gray-600 mb-1">Delivery Address</p>
                              <p>{order.customerAddress}</p>
                              {order.customerNotes && <p className="text-gray-500 italic">Note: {order.customerNotes}</p>}
                              {order.adminNotes && <p className="text-rose-500 font-medium">Store: {order.adminNotes}</p>}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
            <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={fetchOrders} />
          </>
        )}
      </div>
    </div>
  );
}
