import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight, FiStar, FiTruck, FiShield, FiHeart, FiGift,
  FiSun, FiCheckCircle, FiHome, FiBriefcase
} from 'react-icons/fi';
import { RiGiftLine, RiSparklingLine, RiStarSmileLine, RiCake2Line } from 'react-icons/ri';
import { FaWhatsapp, FaRing, FaBaby } from 'react-icons/fa';
import { GiPartyPopper } from 'react-icons/gi';
import { PiHandsPrayingLight } from 'react-icons/pi';
import { MdCelebration, MdLocalShipping } from 'react-icons/md';
import { TbRosetteDiscountCheck } from 'react-icons/tb';
import api from '../../api/api.js';
import ProductCard from '../../components/shop/ProductCard.jsx';
import { SkeletonCard } from '../../components/ui/index.jsx';

const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

const occasions = [
  { label: 'Wedding', icon: FaRing, color: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-600 hover:text-white hover:border-pink-600' },
  { label: 'Birthday', icon: RiCake2Line, color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-600 hover:text-white hover:border-violet-600' },
  { label: 'Diwali', icon: FiSun, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500' },
  { label: 'Pooja', icon: PiHandsPrayingLight, color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500' },
  { label: 'Baby Shower', icon: FaBaby, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-500 hover:text-white hover:border-blue-500' },
  { label: 'Anniversary', icon: FiHeart, color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600' },
  { label: 'Housewarming', icon: FiHome, color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-500 hover:text-white hover:border-teal-500' },
  { label: 'Corporate', icon: FiBriefcase, color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-600 hover:text-white hover:border-slate-600' },
];

const trustBadges = [
  { icon: FiTruck, text: 'Fast Delivery Pan India' },
  { icon: FiShield, text: 'Secure & Safe Ordering' },
  { icon: FiStar, text: 'Premium Quality Products' },
  { icon: FiHeart, text: 'Made with Love' },
  { icon: FiCheckCircle, text: '500+ Happy Customers' },
  { icon: RiSparklingLine, text: 'Curated Gift Collections' },
];

const whyUs = [
  { icon: FiGift, title: 'Curated Collections', desc: 'Every product handpicked for quality, aesthetics, and price.' },
  { icon: TbRosetteDiscountCheck, title: 'Bulk Order Discounts', desc: 'Special pricing for events with 50+ gifts. WhatsApp us!' },
  { icon: MdLocalShipping, title: 'Quick Dispatch', desc: 'Orders packed and shipped within 24 hours.' },
  { icon: RiSparklingLine, title: 'Gift Wrapping', desc: 'Beautiful packaging to make every gift special.' },
];

const floatingOccasions = [
  { label: 'Wedding', icon: FaRing, pos: 'top-2 left-4', delay: 0 },
  { label: 'Birthday', icon: RiCake2Line, pos: 'top-4 right-4', delay: 0.15 },
  { label: 'Diwali', icon: FiSun, pos: 'bottom-8 left-2', delay: 0.3 },
  { label: 'Pooja', icon: PiHandsPrayingLight, pos: 'bottom-4 right-8', delay: 0.45 },
];

const heroAmbientCards = [
  { title: 'Premium Picks', subtitle: 'Curated daily', pos: 'top-16 right-0', delay: 0.2 },
  { title: 'Gift Ready', subtitle: 'Elegant packing', pos: 'bottom-20 left-0', delay: 0.35 },
];

const ctaIcons = [FaRing, RiGiftLine, FiSun, RiCake2Line, GiPartyPopper];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';

  useEffect(() => {
    document.title = "KIKI'S Return Gift Store - Perfect Gifts for Every Occasion";
    Promise.all([api.get('/products/featured'), api.get('/categories/all')])
      .then(([prodRes, catRes]) => {
        setFeatured(prodRes.data.data);
        setCategories(catRes.data.data.slice(0, 8));
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  return (
    <div className="overflow-x-hidden">
      <section className="relative bg-gradient-to-br from-rose-50 via-white to-amber-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-rose-100/60 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-100/50 to-transparent rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="page-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[74vh] pt-3 pb-10">
            <div className="text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 text-xs font-bold px-4 py-2 rounded-full mb-6 border border-rose-200">
                  <RiSparklingLine size={14} /> India's #1 Return Gift Store
                </span>
              </motion.div>

              <motion.h1 {...fadeUp} transition={{ delay: 0.1, duration: 0.6 }}
                className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.05] mb-5">
                Perfect Gifts<br />
                <span className="text-rose-600 italic">for Every</span><br />
                Celebration
              </motion.h1>

              <motion.p {...fadeUp} transition={{ delay: 0.25, duration: 0.5 }}
                className="text-base text-gray-500 mb-8 leading-relaxed max-w-md mx-auto lg:mx-0">
                Curated return gifts for weddings, birthdays, pooja, and every special occasion.
                Premium quality, affordable prices, delivered with love across India.
              </motion.p>

              <motion.div {...fadeUp} transition={{ delay: 0.35 }} className="flex flex-wrap justify-center lg:justify-start gap-3 mb-3">
                <Link to="/shop" className="btn-primary flex items-center gap-2 py-3.5 px-7 text-sm">
                  Shop Now <FiArrowRight size={15} />
                </Link>
                <a href={`https://wa.me/${whatsapp}?text=Hello! I'd like to know more about your return gifts.`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3.5 rounded-full transition-all shadow-sm hover:shadow-green-200 hover:shadow-lg text-sm">
                  <FaWhatsapp size={17} /> WhatsApp Us
                </a>
              </motion.div>

              <motion.div
                {...fadeUp}
                transition={{ delay: 0.42, duration: 0.55 }}
                className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-8 pt-2 border-t border-rose-100 mb-5"
              >
                {[['500+', 'Happy Customers'], ['50+', 'Gift Varieties'], ['100%', 'Quality Assured']].map(([num, label]) => (
                  <div key={label} className="min-w-0 text-center lg:text-left">
                    <p className="font-display text-3xl font-bold text-rose-600">{num}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5 leading-tight">{label}</p>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.6 }}
                className="lg:hidden relative flex items-center justify-center mb-5"
              >
                <div className="relative w-full max-w-[22rem] aspect-square mt-2">
                  <motion.div
                    animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.45, 0.3] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-10 rounded-full border border-rose-100/80"
                  />
                  <motion.div
                    animate={{ scale: [1.04, 1, 1.04], opacity: [0.2, 0.35, 0.2] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                    className="absolute inset-2 rounded-full border border-amber-100/80"
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: [0, -7, 0] }}
                    transition={{ opacity: { delay: 0.8, duration: 0.45 }, y: { delay: 0.5, duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
                    className="absolute top-5 right-1 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-lg shadow-rose-100/60 backdrop-blur-sm"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-400">Premium Picks</p>
                    <p className="mt-0.5 text-xs font-semibold text-gray-700">Curated daily</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: [0, -7, 0] }}
                    transition={{ opacity: { delay: 0.95, duration: 0.45 }, y: { delay: 0.7, duration: 5.2, repeat: Infinity, ease: 'easeInOut' } }}
                    className="absolute bottom-16 left-2 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-lg shadow-rose-100/60 backdrop-blur-sm max-w-[8.5rem]"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-400">Gift Ready</p>
                    <p className="mt-0.5 text-xs font-semibold text-gray-700 leading-tight">Elegant packing</p>
                  </motion.div>

                  <div className="absolute inset-0 flex items-center justify-center pt-7">
                    <motion.div
                      animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-44 h-44 bg-gradient-to-br from-rose-500 to-rose-700 rounded-full flex items-center justify-center shadow-2xl shadow-rose-200"
                    >
                      <RiGiftLine size={60} className="text-white" />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, y: [0, -6, 0] }}
                    transition={{ scale: { delay: 0.65, type: 'spring' }, y: { delay: 1, duration: 4.4, repeat: Infinity, ease: 'easeInOut' } }}
                    className="absolute top-4 left-4 bg-white rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2"
                  >
                    <FaRing size={15} className="text-rose-500" />
                    <span className="text-xs font-semibold text-gray-700">Wedding</span>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, y: [0, -6, 0] }}
                    transition={{ scale: { delay: 0.8, type: 'spring' }, y: { delay: 1.2, duration: 4.2, repeat: Infinity, ease: 'easeInOut' } }}
                    className="absolute bottom-7 right-3 bg-white rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2"
                  >
                    <RiCake2Line size={15} className="text-rose-500" />
                    <span className="text-xs font-semibold text-gray-700">Birthday</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
              className="hidden lg:flex items-center justify-center relative">
              <div className="relative w-full max-w-[28rem] aspect-square">
                <motion.div
                  animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.45, 0.3] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-10 rounded-full border border-rose-100/80"
                />
                <motion.div
                  animate={{ scale: [1.04, 1, 1.04], opacity: [0.2, 0.35, 0.2] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                  className="absolute inset-2 rounded-full border border-amber-100/80"
                />

                {heroAmbientCards.map(({ title, subtitle, pos, delay }) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: [0, -8, 0] }}
                    transition={{ opacity: { delay: delay + 0.5, duration: 0.5 }, y: { delay, duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
                    className={`absolute ${pos} rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-xl shadow-rose-100/60 backdrop-blur-sm`}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-400">{title}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-700">{subtitle}</p>
                  </motion.div>
                ))}

                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-52 h-52 bg-gradient-to-br from-rose-500 to-rose-700 rounded-full flex items-center justify-center shadow-2xl shadow-rose-200"
                  >
                    <RiGiftLine size={68} className="text-white" />
                  </motion.div>
                </div>
                {floatingOccasions.map(({ label, icon: Icon, pos, delay }) => (
                  <motion.div key={label}
                    initial={{ scale: 0 }} animate={{ scale: 1, y: [0, -6, 0] }} transition={{ scale: { delay: delay + 0.6, type: 'spring' }, y: { delay: delay + 1, duration: 4.4, repeat: Infinity, ease: 'easeInOut' } }}
                    className={`absolute ${pos} bg-white rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2`}>
                    <Icon size={18} className="text-rose-500" />
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="bg-rose-600 py-2.5 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...trustBadges, ...trustBadges].map((b, i) => (
            <div key={i} className="flex items-center gap-2 mx-8 text-white text-sm font-medium flex-shrink-0">
              <b.icon size={14} className="text-rose-200" />
              <span>{b.text}</span>
              <RiSparklingLine size={14} className="text-rose-300 ml-8" />
            </div>
          ))}
        </div>
      </div>

      <section className="pt-10 pb-8 bg-white">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="section-title">Shop by Occasion</h2>
            <p className="text-gray-400 mt-2 text-sm">Find the perfect gift for every celebration</p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3">
            {occasions.map(({ label, icon: Icon, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Link to={`/shop?occasion=${label}`}
                  className={`inline-flex items-center gap-2 border font-semibold px-5 py-2.5 rounded-full text-sm transition-all duration-200 ${color}`}>
                  <Icon size={16} /> {label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="pt-8 pb-10 bg-gray-50">
          <div className="page-container">
            <div className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-end sm:justify-between mb-10 gap-3">
              <div>
                <h2 className="section-title">Browse Categories</h2>
                <p className="text-gray-400 text-sm mt-1">Explore our wide range of gift collections</p>
              </div>
              <Link to="/shop" className="btn-ghost text-sm flex items-center gap-1 hidden sm:flex">
                View All <FiArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {categories.map((cat, i) => (
                <motion.div key={cat._id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <Link to={`/shop?category=${cat._id}`}
                    className="flex flex-col items-center gap-2.5 p-4 bg-white rounded-2xl hover:shadow-[0_4px_20px_rgba(225,29,72,0.1)] border border-transparent hover:border-rose-100 transition-all group text-center">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-rose-50 group-hover:bg-rose-100 transition-colors flex-shrink-0">
                      {cat.image
                        ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><FiGift size={22} className="text-rose-400" /></div>
                      }
                    </div>
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-rose-600 transition-colors leading-tight">
                      {cat.name}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-10 bg-white">
        <div className="page-container">
          <div className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-end sm:justify-between mb-10 gap-3">
            <div>
              <h2 className="section-title">Featured Gifts</h2>
              <p className="text-gray-400 text-sm mt-1">Handpicked bestsellers loved by our customers</p>
            </div>
            <Link to="/shop?featured=true" className="btn-outline text-xs hidden sm:flex items-center gap-1.5 py-2.5 px-5">
              View All <FiArrowRight size={13} />
            </Link>
          </div>
          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {featured.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          )}
          <div className="text-center mt-8 sm:hidden">
            <Link to="/shop" className="btn-outline">View All Products</Link>
          </div>
        </div>
      </section>

      <section className="py-10 bg-rose-50">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="section-title">Why Choose KIKI'S?</h2>
            <p className="text-gray-400 text-sm mt-2">We go the extra mile to make your celebrations memorable</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 flex justify-center text-rose-500">
                  <Icon size={34} />
                </div>
                <h3 className="font-display font-bold text-gray-800 text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-gradient-to-r from-rose-600 to-rose-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {ctaIcons.map((Icon, i) => (
            <span key={i} className="absolute" style={{ top: `${10 + i * 18}%`, left: `${i * 20}%`, transform: 'rotate(15deg)' }}>
              <Icon size={44} className="text-white" />
            </span>
          ))}
        </div>
        <div className="page-container text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-5 border border-white/30">
              <RiStarSmileLine size={14} /> Personalized Gift Assistance
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Need Help Choosing?
            </h2>
            <p className="text-rose-200 text-base mb-8 max-w-lg mx-auto">
              Chat with us for personalized gift recommendations, bulk orders, and custom event gifting!
            </p>
            <a href={`https://wa.me/${whatsapp}?text=Hello! I need help choosing return gifts.`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-rose-700 font-bold px-10 py-4 rounded-full hover:bg-rose-50 transition-all shadow-2xl hover:shadow-white/30 text-base">
              <FaWhatsapp size={22} className="text-green-500" /> Chat on WhatsApp
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
