import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiPhone, FiMapPin, FiFileText, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { RiGiftLine } from 'react-icons/ri';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/api.js';
import toast from 'react-hot-toast';
import { isValidPhone, normalizePhone } from '../../utils/validation.js';

function InputWrap({ icon: Icon, label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        {Icon ? <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={15} /> : null}
        {children}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Checkout - KIKI'S Store";
    if (items.length === 0) navigate('/cart');
  }, [items, navigate]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!isValidPhone(form.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName: form.name,
        customerEmail: user?.email || '',
        customerPhone: normalizePhone(form.phone),
        customerAddress: `${form.address}, ${form.city}, ${form.state || ''} - ${form.pincode}`.replace(',  -', ' -').replace(/\s+,/g, ','),
        customerNotes: form.notes,
        items: items.map((item) => ({
          product: item._id,
          quantity: item.quantity,
        })),
      };

      const { data } = await api.post('/orders', payload);
      const orderPayload = data.data;
      clearCart();
      navigate(`/order-confirmation?order=${orderPayload.order.orderNumber}`, {
        replace: true,
        state: orderPayload,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="page-container">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-6">
          <Link to="/" className="hover:text-rose-600">Home</Link><span>/</span>
          <Link to="/cart" className="hover:text-rose-600">Cart</Link><span>/</span>
          <span className="text-gray-600">Checkout</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-3 text-center sm:text-left">Order Summary</h1>
        <p className="mb-8 max-w-2xl text-sm text-gray-500 text-center sm:text-left sm:mx-0 mx-auto">
          Fill in your delivery details and place the order. We will open WhatsApp with your full order message for store confirmation.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-display text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <FiMapPin size={18} className="text-rose-500" /> Delivery Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputWrap icon={FiUser} label="Full Name" required>
                    <input
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="input-field pl-9"
                      placeholder="Your full name"
                      required
                    />
                  </InputWrap>
                  <InputWrap icon={FiPhone} label="Phone Number" required>
                    <input
                      value={form.phone}
                      onChange={(e) => updateField('phone', normalizePhone(e.target.value))}
                      className="input-field pl-9"
                      placeholder="+91 XXXXXXXXXX"
                      required
                    />
                  </InputWrap>
                  <div className="sm:col-span-2">
                    <InputWrap icon={FiMapPin} label="Address" required>
                      <input
                        value={form.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        className="input-field pl-9"
                        placeholder="House/Flat No., Street, Area"
                        required
                      />
                    </InputWrap>
                  </div>
                  <InputWrap label="City" required>
                    <input
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className="input-field"
                      placeholder="City"
                      required
                    />
                  </InputWrap>
                  <InputWrap label="State">
                    <input
                      value={form.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      className="input-field"
                      placeholder="State"
                    />
                  </InputWrap>
                  <InputWrap label="Pincode" required>
                    <input
                      value={form.pincode}
                      onChange={(e) => updateField('pincode', e.target.value)}
                      className="input-field"
                      placeholder="6-digit pincode"
                      required
                    />
                  </InputWrap>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <InputWrap icon={FiFileText} label="Order Notes (optional)">
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={3}
                    className="input-field pl-9 resize-none"
                    placeholder="Any special requests or instructions?"
                  />
                </InputWrap>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
                <h2 className="font-display text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiShoppingBag size={18} className="text-rose-500" /> Order Items
                </h2>
                <div className="space-y-3 mb-5 max-h-56 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const hasDiscount = Number(item.originalPrice || 0) > Number(item.price || 0);

                    return (
                    <div key={item._id} className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                        {item.images?.[0]?.url ? (
                          <img src={item.images[0].url} alt={item.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <RiGiftLine size={18} className="text-rose-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 line-clamp-2 leading-snug pr-2">{item.name}</p>
                        <div className="text-xs text-gray-400 mt-0.5">
                          <span>x{item.quantity}</span>
                          <span className="ml-1.5 font-semibold text-gray-700">Rs.{Number(item.price).toFixed(2)}</span>
                          {hasDiscount ? (
                            <span className="ml-1.5 line-through">Rs.{Number(item.originalPrice).toFixed(2)}</span>
                          ) : null}
                        </div>
                        <p className="text-sm font-bold text-gray-800 mt-1 sm:hidden">
                          Rs.{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <p className="hidden sm:block text-xs font-bold text-gray-800 flex-shrink-0 pt-0.5">
                        Rs.{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  )})}
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 mb-5">
                  Orders are confirmed through WhatsApp only. Payment instructions will be shown on the next page after the WhatsApp step.
                </div>
                <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span><span className="font-semibold text-gray-800">Rs.{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Shipping</span><span className="text-emerald-600 font-semibold text-xs">To be confirmed</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                    <span>Total</span><span className="text-rose-600">Rs.{subtotal.toFixed(2)}</span>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-60"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><FiArrowRight size={16} /> Place Order</>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
