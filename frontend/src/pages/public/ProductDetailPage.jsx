import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMinus, FiPlus, FiShoppingCart, FiStar, FiBell, FiTruck, FiShield, FiRefreshCw } from 'react-icons/fi';
import { RiGiftLine } from 'react-icons/ri';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../../api/api.js';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import ProductCard from '../../components/shop/ProductCard.jsx';
import { PageLoader } from '../../components/ui/index.jsx';
import { getDiscountPercentage, getMrpPrice, getSellingPrice } from '../../utils/pricing.js';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`).then((r) => {
      setData(r.data.data);
      setQty(1);
      setSelectedImg(0);
      document.title = `${r.data.data.product.name} - KIKI'S Store`;
    }).catch(() => {}).finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) return <PageLoader />;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <RiGiftLine size={56} className="text-rose-200" />
        <p className="text-gray-400">Product not found.</p>
        <button onClick={() => navigate('/shop')} className="btn-primary">Browse Shop</button>
      </div>
    );
  }

  const { product, related } = data;
  const image = product.images?.[selectedImg]?.url;
  const sellingPrice = product.discountedPrice ?? getSellingPrice(product);
  const mrpPrice = getMrpPrice(product);
  const discountPercentage = getDiscountPercentage(product);
  const hasDiscount = discountPercentage > 0 && sellingPrice < mrpPrice;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock <= product.lowStockThreshold && product.stock > 0;
  const notifyHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! Please notify me when "${product.name}" is back in stock.`)}`;
  const enquireHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I'm interested in "${product.name}" (Rs.${sellingPrice}). Can I get more details?`)}`;

  const guarantees = [
    { icon: FiTruck, label: 'Fast Delivery' },
    { icon: FiShield, label: 'Quality Assured' },
    { icon: FiRefreshCw, label: 'Easy Returns' },
  ];

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/product/${slug}` } } });
      return;
    }
    addItem(product, qty);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-container py-8">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-6">
          <Link to="/" className="hover:text-rose-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-rose-600 transition-colors">Shop</Link>
          {product.category ? (
            <>
              <span>/</span>
              <Link to={`/shop?category=${product.category._id}`} className="hover:text-rose-600 transition-colors">
                {product.category.name}
              </Link>
            </>
          ) : null}
          <span>/</span>
          <span className="text-gray-600 truncate max-w-[160px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1fr)] gap-8 xl:gap-10 items-start">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm aspect-[0.95/0.82] max-h-[520px] flex items-center justify-center p-4 sm:p-6 product-img-wrap">
              {image ? (
                <img src={image} alt={product.name} loading="eager" className="max-w-[82%] max-h-[82%] object-contain" />
              ) : (
                <div className="flex items-center justify-center text-rose-200">
                  <RiGiftLine size={72} />
                </div>
              )}
            </div>

            {product.images?.length > 1 ? (
              <div className="flex gap-2.5 mt-3">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImg(index)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${selectedImg === index ? 'border-rose-500 shadow-sm' : 'border-gray-200 hover:border-rose-300'}`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col text-center lg:text-left items-center lg:items-start">
            {product.category ? (
              <Link
                to={`/shop?category=${product.category._id}`}
                className="text-xs text-rose-500 font-bold uppercase tracking-widest mb-2 hover:text-rose-700"
              >
                {product.category.name}
              </Link>
            ) : null}

            <h1 className="font-display text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-3">
              {product.name}
            </h1>

            {product.occasion ? (
              <span className="inline-flex w-fit items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full mb-4 font-semibold">
                <FiStar size={11} /> {product.occasion}
              </span>
            ) : null}

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-5 pb-5 border-b border-gray-100 w-full">
              <span className="text-3xl font-bold text-gray-900">Rs.{sellingPrice}</span>
              {hasDiscount ? (
                <>
                  <span className="text-base text-gray-300 line-through">Rs.{mrpPrice}</span>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                    {discountPercentage}% OFF
                  </span>
                </>
              ) : null}
            </div>

            <p className="text-gray-500 leading-relaxed mb-5 text-sm max-w-xl">{product.description}</p>

            <div className="flex items-center justify-center lg:justify-start gap-2 mb-5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className={`text-sm font-semibold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${product.stock} left!` : `${product.stock} in stock`}
              </span>
            </div>

            {!isOutOfStock ? (
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-5">
                <span className="text-sm font-semibold text-gray-600">Qty:</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-4 py-2.5 hover:bg-rose-50 hover:text-rose-600 transition-colors text-gray-600"
                  >
                    <FiMinus size={15} />
                  </button>
                  <span className="px-5 py-2.5 font-bold text-gray-800 min-w-[44px] text-center border-x border-gray-200 text-sm">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="px-4 py-2.5 hover:bg-rose-50 hover:text-rose-600 transition-colors text-gray-600"
                  >
                    <FiPlus size={15} />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2.5 mb-6 max-w-md">
              {isOutOfStock ? (
                <a
                  href={notifyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-sm"
                >
                  <FiBell size={16} /> Notify Me When Available
                </a>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className="btn-primary flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                >
                  <FiShoppingCart size={16} /> Add to Cart
                </motion.button>
              )}

              <a
                href={enquireHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-sm"
              >
                <FaWhatsapp size={16} /> Enquire on WhatsApp
              </a>
            </div>

            <div className="flex flex-wrap gap-3 px-4 py-3 bg-rose-50/50 rounded-xl border border-rose-100 max-w-md">
              {guarantees.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                  <Icon size={13} className="text-rose-500 flex-shrink-0" /> {label}
                </div>
              ))}
            </div>

            {product.sku ? <p className="text-xs text-gray-300 mt-4 font-mono">SKU: {product.sku}</p> : null}
          </motion.div>
        </div>

        {related?.length > 0 ? (
          <section className="mt-16 pt-10 border-t border-gray-100">
            <h2 className="section-title mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {related.map((item, index) => <ProductCard key={item._id} product={item} index={index} />)}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
