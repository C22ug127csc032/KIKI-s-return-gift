import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight, FiShoppingCart, FiTag, FiGift } from 'react-icons/fi';
import { RiGiftLine } from 'react-icons/ri';
import { useCart } from '../../context/CartContext.jsx';
import { EmptyState } from '../../components/ui/index.jsx';

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    taxableSubtotal,
    gstTotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    grandTotal,
    discountTotal,
    discountPercentage,
    totalItems,
  } = useCart();
  const navigate = useNavigate();

  useEffect(() => { document.title = "Cart - KIKI'S Store"; }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="page-container">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-6">
          <Link to="/" className="hover:text-rose-600">Home</Link><span>/</span>
          <span className="text-gray-600">Cart</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center sm:text-left">
          Your Cart {items.length > 0 && <span className="text-rose-600">({items.length})</span>}
        </h1>

        {items.length === 0 ? (
          <EmptyState
            icon={<FiShoppingCart size={48} />}
            title="Your cart is empty"
            message="Add some beautiful gifts to get started!"
            action={<Link to="/shop" className="btn-primary flex items-center gap-2"><FiShoppingBag size={16} /> Browse Gifts</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div key={item._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 flex gap-3 sm:gap-4 shadow-sm hover:shadow-md transition-shadow items-start">
                    <Link to={`/product/${item.slug || item._id}`}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100 product-img-wrap">
                      {item.images?.[0]?.url
                        ? <img src={item.images[0].url} alt={item.name} className="w-full h-full object-contain p-1" />
                        : <div className="w-full h-full flex items-center justify-center text-rose-200"><RiGiftLine size={26} /></div>}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.slug || item._id}`}
                        className="font-semibold text-gray-800 hover:text-rose-600 transition-colors line-clamp-2 text-sm leading-snug">
                        {item.name}
                      </Link>
                      <div className="mt-0.5">
                        <span className="text-xs text-gray-400">Rs.{item.price} each</span>
                        {item.originalPrice > item.price && (
                          <span className="ml-2 text-xs text-gray-300 line-through">Rs.{item.originalPrice}</span>
                        )}
                        {Number(item.gstRate || 0) > 0 ? (
                          <span className="ml-2 text-xs text-emerald-600">incl. GST {Number(item.gstRate)}%</span>
                        ) : null}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 w-fit">
                          <button onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="px-2.5 sm:px-3 py-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors text-gray-500">
                            <FiMinus size={12} />
                          </button>
                          <span className="px-2.5 sm:px-3 py-1.5 font-bold text-sm text-gray-800 border-x border-gray-200 min-w-[32px] sm:min-w-[36px] text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="px-2.5 sm:px-3 py-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors text-gray-500">
                            <FiPlus size={12} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                          <span className="font-bold text-gray-900 text-sm">Rs.{(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeItem(item._id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm lg:sticky lg:top-24">
                <h2 className="font-display text-xl font-bold text-gray-900 mb-5 text-center sm:text-left">Order Summary</h2>
                <div className="space-y-3 mb-5">
                  {discountTotal > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Discount ({discountPercentage.toFixed(2).replace(/\.?0+$/, '')}%)</span>
                      <span className="font-semibold text-emerald-600">- Rs.{discountTotal.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Taxable Amount ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                    <span className="font-semibold text-gray-800">Rs.{taxableSubtotal.toFixed(2)}</span>
                  </div>
                  {cgstTotal > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">CGST</span>
                      <span className="font-semibold text-gray-800">Rs.{cgstTotal.toFixed(2)}</span>
                    </div>
                  ) : null}
                  {sgstTotal > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">SGST</span>
                      <span className="font-semibold text-gray-800">Rs.{sgstTotal.toFixed(2)}</span>
                    </div>
                  ) : null}
                  {igstTotal > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">IGST</span>
                      <span className="font-semibold text-gray-800">Rs.{igstTotal.toFixed(2)}</span>
                    </div>
                  ) : null}
                  {gstTotal > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">GST</span>
                      <span className="font-semibold text-gray-800">Rs.{gstTotal.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-emerald-600 font-semibold text-xs">To be confirmed</span>
                  </div>
                  {grandTotal >= 999 && (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-100">
                      <FiTag size={12} /> Free shipping unlocked <FiGift size={12} />
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-rose-600 text-lg">Rs.{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={() => navigate('/checkout')}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                  Proceed to Checkout <FiArrowRight size={16} />
                </button>
                <Link to="/shop" className="block text-center text-xs text-gray-400 hover:text-rose-600 mt-4 transition-colors font-medium">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
