import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiStar, FiGift, FiBell } from 'react-icons/fi';
import { RiHeartLine, RiHeartFill } from 'react-icons/ri';
import { useState } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getDiscountedPrice } from '../../utils/pricing.js';

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [wished, setWished] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const productPath = `/product/${product.slug || product._id}`;
  const image = product.images?.[0]?.url;
  const discountedPrice = product.discountedPrice ?? getDiscountedPrice(product.price, product.discountPercentage);
  const hasDiscount = Number(product.discountPercentage || 0) > 0 && discountedPrice < Number(product.price || 0);
  const isLowStock = product.stock <= product.lowStockThreshold && product.stock > 0;
  const isOutOfStock = product.stock === 0;
  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';
  const notifyHref = `https://wa.me/${whatsapp}?text=Hi! Please notify me when "${product.name}" is back in stock.`;
  const handleAddToCart = () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    addItem(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="product-card group">

      {/* Image */}
      <Link to={productPath} className="block relative product-img-wrap bg-gray-50" style={{ aspectRatio: '1/1' }}>
        {image ? (
          <img src={image} alt={product.name} loading="lazy" decoding="async"
            className="w-full h-full object-contain p-3" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-rose-200">
            <FiGift size={48} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {hasDiscount && (
            <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              -{product.discountPercentage}%
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">Sold Out</span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">Low Stock</span>
          )}
          {product.featured && !hasDiscount && (
            <span className="bg-amber-400 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
              <FiStar size={9} /> Top Pick
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button onClick={(e) => { e.preventDefault(); setWished(!wished); }}
          className="absolute top-2.5 right-2.5 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all opacity-0 group-hover:opacity-100">
          {wished
            ? <RiHeartFill size={16} className="text-rose-500" />
            : <RiHeartLine size={16} className="text-gray-400" />}
        </button>
      </Link>

      {/* Info */}
      <div className="p-3.5 pb-4">
        {product.category && (
          <p className="text-[10px] text-rose-500 font-semibold uppercase tracking-widest mb-1">
            {product.category.name}
          </p>
        )}
        <Link to={productPath}>
          <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-2.5 line-clamp-2 hover:text-rose-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-gray-900">₹{discountedPrice}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through ml-1.5">₹{product.price}</span>
            )}
          </div>

          {isOutOfStock ? (
            <a href={notifyHref} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
              <FiBell size={12} /> Notify
            </a>
          ) : (
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleAddToCart}
              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm">
              <FiShoppingCart size={12} /> Add
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
