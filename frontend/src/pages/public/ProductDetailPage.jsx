import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMinus, FiPlus, FiShoppingCart, FiStar, FiTruck, FiShield, FiRefreshCw } from 'react-icons/fi';
import { RiGiftLine } from 'react-icons/ri';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../../api/api.js';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import ProductCard from '../../components/shop/ProductCard.jsx';
import { PageLoader } from '../../components/ui/index.jsx';
import { getMrpPrice, getSellingPrice } from '../../utils/pricing.js';
import { getDisplayProductName } from '../../utils/productName.js';
import { useStoreWhatsappNumber } from '../../hooks/useStoreWhatsappNumber.js';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const whatsapp = useStoreWhatsappNumber();

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`).then((r) => {
      setData(r.data.data);
      setQty(1);
      setSelectedImg(0);
      document.title = `${getDisplayProductName(r.data.data.product)} - KIKI'S Store`;
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
  const displayName = getDisplayProductName(product);
  const image = product.images?.[selectedImg]?.url;
  const sellingPrice = product.discountedPrice ?? getSellingPrice(product);
  const mrpPrice = getMrpPrice(product);
  const discountPercentage = Number(product.discountPercentage || 0);
  const showStrikePrice = Number(mrpPrice || 0) > Number(sellingPrice || 0);
  const showDiscountBadge = discountPercentage > 0;
  const productOccasions = product.occasions?.length ? product.occasions : (product.occasion ? [product.occasion] : []);
  const enquireHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I'm interested in "${displayName}" (Rs.${Math.round(Number(sellingPrice || 0))}). Can I get more details?`)}`;

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
          <span className="text-gray-600 truncate max-w-[160px]">{displayName}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1fr)] gap-8 xl:gap-10 items-start">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm aspect-[0.95/0.82] max-h-[520px] flex items-center justify-center p-4 sm:p-6 product-img-wrap">
              {image ? (
                <img src={image} alt={displayName} loading="eager" className="max-w-[82%] max-h-[82%] object-contain" />
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
              {displayName}
            </h1>

            {productOccasions.length ? (
              <div className="mb-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {productOccasions.map((occasion) => (
                  <span key={occasion} className="inline-flex w-fit items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full font-semibold">
                    <FiStar size={11} /> {occasion}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-5 pb-5 border-b border-gray-100 w-full">
              <span className="text-3xl font-bold text-gray-900">Rs.{Number(sellingPrice || 0).toFixed(2)}</span>
              {showStrikePrice ? (
                <>
                  <span className="text-base text-gray-300 line-through">Rs.{Number(mrpPrice || 0).toFixed(2)}</span>
                  {showDiscountBadge ? (
                    <span className="product-discount-badge bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                    {discountPercentage}% OFF
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>

            <p className="text-gray-500 leading-relaxed mb-5 text-sm max-w-xl">{product.description}</p>

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
                  onClick={() => setQty(qty + 1)}
                  className="px-4 py-2.5 hover:bg-rose-50 hover:text-rose-600 transition-colors text-gray-600"
                >
                  <FiPlus size={15} />
                </button>
              </div>
            </div>

            <div className="mb-6 flex w-full max-w-md flex-col gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="group flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(225,29,72,0.22)] transition-all hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-[0_18px_36px_rgba(225,29,72,0.28)]"
              >
                <FiShoppingCart size={17} className="transition-transform group-hover:-rotate-6 group-hover:scale-110" />
                Add to Cart
              </motion.button>

              <a
                href={enquireHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-green-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(34,197,94,0.2)] transition-all hover:-translate-y-0.5 hover:bg-green-600 hover:shadow-[0_18px_36px_rgba(34,197,94,0.26)]"
              >
                <FaWhatsapp size={17} className="transition-transform group-hover:scale-110" /> Enquire on WhatsApp
              </a>
            </div>

            <div className="flex w-full max-w-md flex-wrap gap-2.5 rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3.5">
              {guarantees.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
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
