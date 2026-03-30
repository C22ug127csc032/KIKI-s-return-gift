import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight, FiStar, FiTruck, FiShield, FiHeart, FiGift,
  FiSun, FiCheckCircle, FiHome, FiBriefcase
} from 'react-icons/fi';
import { RiGiftLine, RiSparklingLine, RiStarSmileLine, RiCake2Line } from 'react-icons/ri';
import { FaWhatsapp, FaRing, FaBaby, FaHeart } from 'react-icons/fa';
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

const heroRainItems = [
  { Icon: FaHeart, left: '5%', size: 18, delay: '0s', duration: '6.4s', drift: '-18px', color: 'text-rose-500' },
  { Icon: RiSparklingLine, left: '14%', size: 20, delay: '0.9s', duration: '5.5s', drift: '24px', color: 'text-amber-500' },
  { Icon: FaHeart, left: '24%', size: 16, delay: '1.7s', duration: '5.9s', drift: '18px', color: 'text-pink-500' },
  { Icon: MdCelebration, left: '35%', size: 18, delay: '1.1s', duration: '6.8s', drift: '-20px', color: 'text-rose-400' },
  { Icon: RiSparklingLine, left: '48%', size: 22, delay: '0.4s', duration: '5.8s', drift: '16px', color: 'text-amber-500' },
  { Icon: FaHeart, left: '61%', size: 17, delay: '2.2s', duration: '6.1s', drift: '-16px', color: 'text-rose-500' },
  { Icon: RiSparklingLine, left: '72%', size: 18, delay: '0.7s', duration: '5.7s', drift: '22px', color: 'text-fuchsia-400' },
  { Icon: FaHeart, left: '82%', size: 19, delay: '1.5s', duration: '6.6s', drift: '-22px', color: 'text-pink-500' },
  { Icon: RiSparklingLine, left: '91%', size: 17, delay: '2.4s', duration: '5.6s', drift: '14px', color: 'text-amber-500' },
];

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
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-amber-50">
        <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] translate-x-1/4 -translate-y-1/3 rounded-full bg-gradient-to-bl from-rose-100/60 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 -translate-x-1/4 translate-y-1/3 rounded-full bg-gradient-to-tr from-amber-100/50 to-transparent" />
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[5] h-screen overflow-hidden">
          {heroRainItems.map(({ Icon, left, size, delay, duration, drift, color }, index) => (
            <span
              key={`${left}-${index}`}
              className={`hero-rain-item absolute -top-12 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 shadow-[0_10px_24px_rgba(244,114,182,0.18)] ring-1 ring-white/80 backdrop-blur-[2px] sm:h-10 sm:w-10 ${color}`}
              style={{ left, ['--delay']: delay, ['--duration']: duration, ['--drift']: drift }}
              aria-hidden="true"
            >
              <Icon size={size} />
            </span>
          ))}
        </div>

        <div className="page-container relative z-10">
          <div className="grid min-h-[74vh] grid-cols-1 items-center gap-8 pb-10 pt-3 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-100 px-4 py-2 text-xs font-bold text-rose-700">
                  <RiSparklingLine size={14} /> India's #1 Return Gift Store
                </span>
              </motion.div>

              <motion.h1
                {...fadeUp}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="mb-5 font-display text-5xl font-bold leading-[1.05] text-gray-900 md:text-6xl lg:text-7xl"
              >
                Perfect Gifts
                <br />
                <span className="italic text-rose-600">for Every</span>
                <br />
                Celebration
              </motion.h1>

              <motion.p
                {...fadeUp}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="mx-auto mb-8 max-w-md text-base leading-relaxed text-gray-500 lg:mx-0"
              >
                Curated return gifts for weddings, birthdays, pooja, and every special occasion.
                Premium quality, affordable prices, delivered with love across India.
              </motion.p>

              <motion.div {...fadeUp} transition={{ delay: 0.35 }} className="mb-3 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link to="/shop" className="btn-primary flex items-center gap-2 px-7 py-3.5 text-sm">
                  Shop Now <FiArrowRight size={15} />
                </Link>
                <a
                  href={`https://wa.me/${whatsapp}?text=Hello! I'd like to know more about your return gifts.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-green-500 px-6 py-3.5 text-sm font-semibold text-white transition-all shadow-sm hover:bg-green-600 hover:shadow-lg hover:shadow-green-200"
                >
                  <FaWhatsapp size={17} /> WhatsApp Us
                </a>
              </motion.div>

              <motion.div
                {...fadeUp}
                transition={{ delay: 0.42, duration: 0.55 }}
                className="mb-5 grid grid-cols-3 gap-3 border-t border-rose-100 pt-2 sm:flex sm:flex-wrap sm:gap-8"
              >
                {[['500+', 'Happy Customers'], ['50+', 'Gift Varieties'], ['100%', 'Quality Assured']].map(([num, label]) => (
                  <div key={label} className="min-w-0 text-center lg:text-left">
                    <p className="font-display text-3xl font-bold text-rose-600">{num}</p>
                    <p className="mt-0.5 text-xs font-medium leading-tight text-gray-400">{label}</p>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.6 }}
                className="relative mb-5 flex items-center justify-center lg:hidden"
              >
                <div className="relative mt-2 aspect-square w-full max-w-[22rem]">
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
                    className="absolute right-1 top-5 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-lg shadow-rose-100/60 backdrop-blur-sm"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-400">Premium Picks</p>
                    <p className="mt-0.5 text-xs font-semibold text-gray-700">Curated daily</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: [0, -7, 0] }}
                    transition={{ opacity: { delay: 0.95, duration: 0.45 }, y: { delay: 0.7, duration: 5.2, repeat: Infinity, ease: 'easeInOut' } }}
                    className="absolute bottom-16 left-2 max-w-[8.5rem] rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-lg shadow-rose-100/60 backdrop-blur-sm"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-400">Gift Ready</p>
                    <p className="mt-0.5 text-xs font-semibold leading-tight text-gray-700">Elegant packing</p>
                  </motion.div>

                  <div className="absolute inset-0 flex items-center justify-center pt-7">
                    <motion.div
                      animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      className="flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 shadow-2xl shadow-rose-200"
                    >
                      <RiGiftLine size={60} className="text-white" />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, y: [0, -6, 0] }}
                    transition={{ scale: { delay: 0.65, type: 'spring' }, y: { delay: 1, duration: 4.4, repeat: Infinity, ease: 'easeInOut' } }}
                    className="absolute left-4 top-4 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-lg"
                  >
                    <FaRing size={15} className="text-rose-500" />
                    <span className="text-xs font-semibold text-gray-700">Wedding</span>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, y: [0, -6, 0] }}
                    transition={{ scale: { delay: 0.8, type: 'spring' }, y: { delay: 1.2, duration: 4.2, repeat: Infinity, ease: 'easeInOut' } }}
                    className="absolute bottom-7 right-3 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-lg"
                  >
                    <RiCake2Line size={15} className="text-rose-500" />
                    <span className="text-xs font-semibold text-gray-700">Birthday</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="relative hidden items-center justify-center lg:flex"
            >
              <div className="relative aspect-square w-full max-w-[28rem]">
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
                    className="flex h-52 w-52 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 shadow-2xl shadow-rose-200"
                  >
                    <RiGiftLine size={68} className="text-white" />
                  </motion.div>
                </div>
                {floatingOccasions.map(({ label, icon: Icon, pos, delay }) => (
                  <motion.div
                    key={label}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, y: [0, -6, 0] }}
                    transition={{ scale: { delay: delay + 0.6, type: 'spring' }, y: { delay: delay + 1, duration: 4.4, repeat: Infinity, ease: 'easeInOut' } }}
                    className={`absolute ${pos} flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-lg`}
                  >
                    <Icon size={18} className="text-rose-500" />
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden bg-rose-600 py-2.5">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...trustBadges, ...trustBadges].map((b, i) => (
            <div key={i} className="mx-8 flex flex-shrink-0 items-center gap-2 text-sm font-medium text-white">
              <b.icon size={14} className="text-rose-200" />
              <span>{b.text}</span>
              <RiSparklingLine size={14} className="ml-8 text-rose-300" />
            </div>
          ))}
        </div>
      </div>

      <section className="bg-white pb-8 pt-10">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 text-center">
            <h2 className="section-title">Shop by Occasion</h2>
            <p className="mt-2 text-sm text-gray-400">Find the perfect gift for every celebration</p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3">
            {occasions.map(({ label, icon: Icon, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Link to={`/shop?occasion=${label}`} className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${color}`}>
                  <Icon size={16} /> {label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="bg-gray-50 pb-10 pt-8">
          <div className="page-container">
            <div className="mb-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
              <div>
                <h2 className="section-title">Browse Categories</h2>
                <p className="mt-1 text-sm text-gray-400">Explore our wide range of gift collections</p>
              </div>
              <Link to="/shop" className="btn-ghost hidden items-center gap-1 text-sm sm:flex">
                View All <FiArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {categories.map((cat, i) => (
                <motion.div key={cat._id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <Link
                    to={`/shop?category=${cat._id}`}
                    className="group flex flex-col items-center gap-2.5 rounded-2xl border border-transparent bg-white p-4 text-center transition-all hover:border-rose-100 hover:shadow-[0_4px_20px_rgba(225,29,72,0.1)]"
                  >
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-rose-50 transition-colors group-hover:bg-rose-100">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center"><FiGift size={22} className="text-rose-400" /></div>
                      )}
                    </div>
                    <span className="text-xs font-semibold leading-tight text-gray-600 transition-colors group-hover:text-rose-600">
                      {cat.name}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white py-10">
        <div className="page-container">
          <div className="mb-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
            <div>
              <h2 className="section-title">Featured Gifts</h2>
              <p className="mt-1 text-sm text-gray-400">Handpicked bestsellers loved by our customers</p>
            </div>
            <Link to="/shop?featured=true" className="btn-outline hidden items-center gap-1.5 px-5 py-2.5 text-xs sm:flex">
              View All <FiArrowRight size={13} />
            </Link>
          </div>
          {loadingProducts ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          )}
          <div className="mt-8 text-center sm:hidden">
            <Link to="/shop" className="btn-outline">View All Products</Link>
          </div>
        </div>
      </section>

      <section className="bg-rose-50 py-10">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <h2 className="section-title">Why Choose KIKI'S?</h2>
            <p className="mt-2 text-sm text-gray-400">We go the extra mile to make your celebrations memorable</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex justify-center text-rose-500">
                  <Icon size={34} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-800 font-display">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-r from-rose-600 to-rose-800 py-14">
        <div className="absolute inset-0 opacity-10">
          {ctaIcons.map((Icon, i) => (
            <span key={i} className="absolute" style={{ top: `${10 + i * 18}%`, left: `${i * 20}%`, transform: 'rotate(15deg)' }}>
              <Icon size={44} className="text-white" />
            </span>
          ))}
        </div>
        <div className="page-container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-2 text-xs font-semibold text-white">
              <RiStarSmileLine size={14} /> Personalized Gift Assistance
            </div>
            <h2 className="mb-4 font-display text-4xl font-bold text-white md:text-5xl">
              Need Help Choosing?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-base text-rose-200">
              Chat with us for personalized gift recommendations, bulk orders, and custom event gifting!
            </p>
            <a
              href={`https://wa.me/${whatsapp}?text=Hello! I need help choosing return gifts.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-white px-10 py-4 text-base font-bold text-rose-700 shadow-2xl transition-all hover:bg-rose-50 hover:shadow-white/30"
            >
              <FaWhatsapp size={22} className="text-green-500" /> Chat on WhatsApp
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
