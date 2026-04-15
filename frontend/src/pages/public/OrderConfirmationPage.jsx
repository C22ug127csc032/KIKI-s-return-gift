import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import { FiCheckCircle, FiCopy, FiHome, FiPackage, FiUploadCloud } from 'react-icons/fi';
import { RiGiftLine } from 'react-icons/ri';
import api from '../../api/api.js';
import toast from 'react-hot-toast';

const buildFallbackPaymentInfo = (settings) => ({
  whatsappNumber: settings?.whatsappNumber || '',
  upiId: settings?.upiId || '',
  upiQrImage: settings?.upiQrImage || '',
  bankAccountName: settings?.bankAccountName || '',
  bankAccountNumber: settings?.bankAccountNumber || '',
  bankIFSC: settings?.bankIFSC || '',
  bankBranch: settings?.bankBranch || '',
  gstPercentage: settings?.gstPercentage ?? 0,
  gstNumber: settings?.gstNumber || '',
  paymentInstructions: settings?.paymentInstructions || '',
});

const formatOrderAmount = (value) => `Rs.${Number(value || 0).toFixed(2)}`;
const formatDiscountPercentage = (value) => Number(value || 0)
  .toFixed(2)
  .replace(/\.?0+$/, '');

export default function OrderConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPayload = location.state;
  const orderNumber = searchParams.get('order') || initialPayload?.order?.orderNumber || '';

  const [order, setOrder] = useState(initialPayload?.order || null);
  const [paymentInfo, setPaymentInfo] = useState(initialPayload?.paymentInfo || null);
  const [whatsappUrl, setWhatsappUrl] = useState(initialPayload?.whatsappUrl || '');
  const [loading, setLoading] = useState(!initialPayload?.order && Boolean(orderNumber));
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const openedWhatsappRef = useRef(false);

  const displayOrderCode = useMemo(
    () => order?.invoiceNumber || order?.orderNumber || order?._id?.slice(-8)?.toUpperCase() || '',
    [order]
  );
  const orderTotals = useMemo(() => {
    const items = order?.items || [];
    const total = items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const originalPrice = Number(item.originalPrice || item.price || 0);
      return sum + (originalPrice * quantity);
    }, 0);
    const subTotal = Number(order?.subtotal || order?.totalAmount || 0);
    const discount = Math.max(total - subTotal, 0);
    const discountPercentage = total > 0 ? (discount / total) * 100 : 0;

    return {
      total: total || subTotal,
      discount,
      discountPercentage: formatDiscountPercentage(discountPercentage),
      subTotal,
    };
  }, [order]);

  useEffect(() => {
    document.title = "Order Confirmed - KIKI'S Store";
  }, []);

  useEffect(() => {
    if (order || !orderNumber) {
      if (!order && !orderNumber) navigate('/');
      return;
    }

    const loadOrder = async () => {
      setLoading(true);
      try {
        const [orderRes, settingsRes] = await Promise.all([
          api.get(`/orders/number/${orderNumber}`),
          api.get('/settings'),
        ]);
        const orderData = orderRes.data.data;
        const settings = settingsRes.data.data;
        const fallbackWhatsapp = settings?.whatsappNumber
          ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hi! I just placed order ${orderData.orderNumber}. Can you confirm the details?`)}`
          : '';

        setOrder(orderData);
        setPaymentInfo(buildFallbackPaymentInfo(settings));
        setWhatsappUrl(fallbackWhatsapp);
      } catch {
        toast.error('Unable to load your order details');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [order, orderNumber, navigate]);

  useEffect(() => {
    if (!whatsappUrl || openedWhatsappRef.current || !order?.orderNumber) return;
    const sessionKey = `kiki_whatsapp_opened_${order.orderNumber}`;
    if (window.sessionStorage.getItem(sessionKey)) return;
    openedWhatsappRef.current = true;
    window.sessionStorage.setItem(sessionKey, 'true');
    window.location.href = whatsappUrl;
  }, [whatsappUrl, order]);

  const copyId = async () => {
    if (!displayOrderCode) return;
    await navigator.clipboard.writeText(displayOrderCode);
    toast.success('Order ID copied!');
  };

  const handleProofUpload = async (e) => {
    e.preventDefault();
    if (!proofFile || !order?.orderNumber) {
      toast.error('Please choose a screenshot first');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('screenshot', proofFile);
      await api.put(`/orders/number/${order.orderNumber}/payment-screenshot`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Payment screenshot uploaded');
      setProofFile(null);
      setOrder((current) => current ? { ...current, paymentScreenshot: 'uploaded' } : current);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload screenshot');
    } finally {
      setUploading(false);
    }
  };

  if (loading || !order) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white py-8 sm:py-16">
      <div className="page-container max-w-4xl mx-auto px-3 sm:px-6">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
              <FiCheckCircle size={40} className="text-emerald-600 sm:w-12 sm:h-12" />
            </motion.div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Order Summary</h1>
          <p className="text-gray-500 text-sm mb-6 sm:mb-8 max-w-2xl mx-auto">
            Your order has been saved. WhatsApp should open with your full order details so the store can confirm it. After payment, you can optionally upload the screenshot here.
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Order ID</p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono font-bold text-gray-800 text-lg">{displayOrderCode}</span>
              <button onClick={copyId} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                <FiCopy size={15} />
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] text-left">
            <div className="space-y-6">
              {order.items?.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-700 text-sm mb-4">Items Ordered</h3>
                  <div className="space-y-3">
                    {order.items.map((item, index) => {
                      const hasDiscount = Number(item.originalPrice || 0) > Number(item.price || 0);

                      return (
                      <div key={`${item.product || item.name}-${index}`} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                          <RiGiftLine size={16} className="text-rose-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-700 leading-snug break-words">{item.name || item.product?.name || 'Product'}</p>
                          <div className="text-xs text-gray-400 flex flex-wrap gap-x-1.5">
                            <span>Qty: {item.quantity} x </span>
                            <span className="font-semibold text-gray-700">Rs.{Number(item.price).toFixed(2)}</span>
                            {hasDiscount ? (
                              <span className="ml-1.5 line-through">Rs.{Number(item.originalPrice).toFixed(2)}</span>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gray-800 flex-shrink-0 self-start">Rs.{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    )})}
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Total</span>
                        <span>{formatOrderAmount(orderTotals.total)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Discount ({orderTotals.discountPercentage}%)</span>
                        <span>- {formatOrderAmount(orderTotals.discount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-800 text-sm">
                        <span>Sub Total</span>
                        <span className="text-rose-600">{formatOrderAmount(orderTotals.subTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-700 text-sm mb-3">Delivery Details</h3>
                <p className="text-sm text-gray-600 font-semibold">{order.customerName}</p>
                <p className="text-sm text-gray-500">{order.customerAddress}</p>
                <p className="text-sm text-gray-500">{order.customerPhone}</p>
                {order.customerNotes ? <p className="text-sm text-gray-500 mt-2">Note: {order.customerNotes}</p> : null}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="font-semibold text-gray-700 text-sm">Share Payment Screenshot</h3>
                  {order.paymentScreenshot ? <span className="badge badge-green">Uploaded</span> : <span className="text-xs text-gray-400">Optional</span>}
                </div>
                <form onSubmit={handleProofUpload} className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="input-field text-sm file:mr-2 sm:file:mr-3 file:rounded-lg file:border-0 file:bg-rose-50 file:px-3 file:py-1 file:text-xs file:text-rose-600"
                  />
                  <button type="submit" disabled={uploading} className="btn-outline w-full sm:w-auto flex items-center justify-center gap-2">
                    {uploading ? <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> : <FiUploadCloud size={16} />}
                    Upload Screenshot
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">WhatsApp Confirmation</h3>
                <p className="text-sm text-gray-500 mb-4">
                  If WhatsApp did not open automatically, use the button below to send your order details to the store admin.
                </p>
                <a
                  href={whatsappUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white transition-all ${whatsappUrl ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 pointer-events-none'}`}
                >
                  <FaWhatsapp size={18} /> Open WhatsApp Chat
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">WhatsApp & Payment</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">WhatsApp Number</p>
                    <p className="font-semibold text-gray-800">{paymentInfo?.whatsappNumber || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">UPI ID</p>
                    <p className="font-semibold text-gray-800">{paymentInfo?.upiId || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Bank Account Name</p>
                    <p className="font-semibold text-gray-800">{paymentInfo?.bankAccountName || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Bank Account Number</p>
                    <p className="font-semibold text-gray-800">{paymentInfo?.bankAccountNumber || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">IFSC Code</p>
                    <p className="font-semibold text-gray-800">{paymentInfo?.bankIFSC || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Branch Name</p>
                    <p className="font-semibold text-gray-800">{paymentInfo?.bankBranch || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">GST (%)</p>
                    <p className="font-semibold text-gray-800">{paymentInfo?.gstPercentage ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">GST Number</p>
                    <p className="font-semibold text-gray-800">{paymentInfo?.gstNumber || 'Not set'}</p>
                  </div>
                  {paymentInfo?.upiQrImage ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">UPI QR Code</p>
                      <img src={paymentInfo.upiQrImage} alt="UPI QR Code" className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl border border-gray-100 object-contain p-2 bg-white" />
                    </div>
                  ) : null}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Payment Instructions</p>
                    <p className="text-gray-600 leading-6">{paymentInfo?.paymentInstructions || 'Please complete your payment and share the screenshot on WhatsApp if needed.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link to="/" className="btn-primary flex items-center justify-center gap-2 py-3.5 px-8">
              <FiHome size={16} /> Back to Home
            </Link>
            <Link to="/my-orders" className="btn-outline flex items-center justify-center gap-2 py-3.5 px-8">
              <FiPackage size={16} /> My Orders
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
