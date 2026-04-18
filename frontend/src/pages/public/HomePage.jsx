import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
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
import heroImage1 from '../../assets/hero-1.jpg';
import heroImage2 from '../../assets/hero-2.jpg';
import heroImage3 from '../../assets/hero-3.jpg';
import { useStoreWhatsappNumber } from '../../hooks/useStoreWhatsappNumber.js';

const heroSlides = [
  {
    id: 0,
    image: heroImage1,
    tag: 'Wedding & Haldi',
    mobileTag: 'Wedding Gifts',
    tagIcon: FaRing,
    heading: ['Perfect Gifts', 'for Every Celebration'],
    italicLine: 1,
    sub: 'Curated return gifts for weddings, birthdays, pooja, and every special occasion. Premium quality, affordable prices.',
    cta: 'Shop Gifts',
    ctaLink: '/shop?occasion=Wedding',
    badge1: { label: 'Gift Ready', value: 'Elegant Packing' },
    badge2: { label: 'Premium Picks', value: 'Curated Daily' },
    accent: 'from-rose-700/80 via-rose-600/60 to-transparent',
  },
  {
    id: 1,
    image: heroImage2,
    tag: 'Birthday & Anniversary',
    mobileTag: 'Birthday Gifts',
    tagIcon: RiCake2Line,
    heading: ['Celebrate Every', 'Special Occasion'],
    italicLine: 1,
    sub: 'From sweet hampers to luxury boxes — find the perfect birthday return gift for every age and taste.',
    cta: 'Shop Gifts',
    ctaLink: '/shop?occasion=Birthday',
    badge1: { label: '50+ Varieties', value: 'For All Ages' },
    badge2: { label: '100% Quality', value: 'Assured' },
    accent: 'from-fuchsia-900/80 via-rose-700/55 to-transparent',
  },
  {
    id: 2,
    image: heroImage3,
    tag: 'Pooja & Diwali',
    mobileTag: 'Pooja Gifts',
    tagIcon: PiHandsPrayingLight,
    heading: ['Bless Every', 'Home with Joy & Love'],
    italicLine: 1,
    sub: 'Handpicked pooja and Diwali return gifts with traditional charm — thoughtful, affordable & delivered pan-India.',
    cta: 'Shop Gifts',
    ctaLink: '/shop?occasion=Diwali',
    badge1: { label: 'Pan India', value: 'Delivery Available' },
    badge2: { label: '500+ Customers', value: 'Happy & Loved' },
    accent: 'from-amber-900/80 via-rose-800/55 to-transparent',
  },
];

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

const ctaIcons = [FaRing, RiGiftLine, FiSun, RiCake2Line, GiPartyPopper];

const mergeHeroSlides = (slides = []) =>
  heroSlides.map((defaultSlide, index) => {
    const apiSlide = slides.find((slide) => Number(slide.order) === index) || slides[index] || {};
    return {
      ...defaultSlide,
      image: apiSlide.image || defaultSlide.image,
      heading: [
        apiSlide.titleLineOne ?? defaultSlide.heading[0],
        apiSlide.titleLineTwo ?? defaultSlide.heading[1],
      ],
      ctaLink: apiSlide.buttonLink || defaultSlide.ctaLink,
    };
  });

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dynamicHeroSlides, setDynamicHeroSlides] = useState(heroSlides);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const heroTimer = useRef(null);
  const heroSectionRef = useRef(null);
  const heroTouchStartXRef = useRef(null);
  const whatsapp = useStoreWhatsappNumber();
  const { scrollYProgress } = useScroll({
    target: heroSectionRef,
    offset: ['start start', 'end start'],
  });
  const heroBgY = useSpring(useTransform(scrollYProgress, [0, 1], ['0%', '12%']), {
    stiffness: 110,
    damping: 26,
    mass: 0.35,
  });
  const heroBgScale = useSpring(useTransform(scrollYProgress, [0, 1], [1, 1.08]), {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  });
  const heroContentY = useSpring(useTransform(scrollYProgress, [0, 1], ['0%', '-10%']), {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  });
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.9, 0.72]);

  const changeHeroSlide = (direction) => {
    setHeroIndex((current) => {
      const totalSlides = dynamicHeroSlides.length || 1;
      return (current + direction + totalSlides) % totalSlides;
    });
  };

  const handleHeroTouchStart = (event) => {
    heroTouchStartXRef.current = event.touches?.[0]?.clientX ?? null;
    setHeroPaused(true);
  };

  const handleHeroTouchEnd = (event) => {
    const touchStartX = heroTouchStartXRef.current;
    const touchEndX = event.changedTouches?.[0]?.clientX ?? null;
    heroTouchStartXRef.current = null;
    setHeroPaused(false);

    if (touchStartX === null || touchEndX === null) return;

    const swipeDistance = touchStartX - touchEndX;
    if (Math.abs(swipeDistance) < 40) return;

    changeHeroSlide(swipeDistance > 0 ? 1 : -1);
  };

  useEffect(() => {
    if (heroPaused) return;
    heroTimer.current = setInterval(() => {
      setHeroIndex(i => (i + 1) % dynamicHeroSlides.length);
    }, 4000);
    return () => clearInterval(heroTimer.current);
  }, [heroPaused, heroIndex, dynamicHeroSlides.length]);

  useEffect(() => {
    document.title = "KIKI'S Return Gift Store - Perfect Gifts for Every Occasion";
    Promise.all([api.get('/products/featured'), api.get('/categories/all'), api.get('/hero-section')])
      .then(([prodRes, catRes, heroRes]) => {
        setFeatured(prodRes.data.data);
        setCategories(catRes.data.data.slice(0, 8));
        setDynamicHeroSlides(mergeHeroSlides(heroRes.data.data?.slides || []));
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  const slide = dynamicHeroSlides[heroIndex];
  const heroHeadingLines = [slide.heading[0], slide.heading[1]].filter(Boolean);

  return (
    <div className="relative overflow-x-hidden">

      {/* ── HERO SLIDER ── */}
      <section
        ref={heroSectionRef}
        className="relative h-[92vh] min-h-[560px] max-h-[820px] overflow-hidden"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
        onTouchStart={handleHeroTouchStart}
        onTouchEnd={handleHeroTouchEnd}
      >
        {/* Slide backgrounds */}
        {dynamicHeroSlides.map((s, i) => (
          <motion.div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              opacity: i === heroIndex ? 1 : 0,
              zIndex: i === heroIndex ? 1 : 0,
              y: heroBgY,
              scale: heroBgScale,
            }}
          >
            <img
              src={s.image}
              alt={s.tag}
              className="h-full w-full object-cover object-center"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>
        ))}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex h-[3px]">
          {dynamicHeroSlides.map((s, i) => (
            <div key={s.id} className="flex-1 bg-white/20">
              <div
                className="h-full bg-white transition-none"
                style={{
                  width: i === heroIndex ? '100%' : i < heroIndex ? '100%' : '0%',
                  transition: i === heroIndex ? `width ${heroPaused ? '0s' : '4s'} linear` : 'none',
                }}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center pt-10 sm:pt-0"
          style={{ y: heroContentY, opacity: heroContentOpacity }}
        >
          <div className="page-container w-full">
            <div className="mx-auto max-w-3xl text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroIndex}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                  <h1 className="mx-auto mb-8 flex w-full max-w-[24ch] flex-col items-center gap-1.5 font-display text-4xl font-bold leading-[1.08] text-white drop-shadow-sm sm:max-w-[26ch] sm:text-5xl md:gap-2 md:text-6xl lg:text-7xl">
                    {heroHeadingLines.map((line, li) => (
                      <span key={li} className="block whitespace-nowrap text-center">
                        {line}
                      </span>
                    ))}
                  </h1>

                  <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      to={slide.ctaLink}
                      className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-full bg-rose-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-rose-700 hover:shadow-rose-500/40 active:scale-95 sm:min-w-0"
                    >
                      Shop <FiArrowRight size={15} />
                    </Link>
                    <Link
                      to={`https://wa.me/${whatsapp}?text=Hello! I'd like to know more about your return gifts.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-full bg-green-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-green-600 active:scale-95 sm:min-w-0"
                    >
                      <FaWhatsapp size={17} /> WhatsApp Us
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="site-signature-band relative my-4 overflow-hidden bg-rose-600 py-2.5 sm:my-5">
        <div className="relative z-[6] flex animate-marquee whitespace-nowrap">
          {[...trustBadges, ...trustBadges].map((b, i) => (
            <div key={i} className="mx-8 flex flex-shrink-0 items-center gap-2 text-sm font-medium text-white">
              <b.icon size={14} className="text-rose-200" />
              <span>{b.text}</span>
              <RiSparklingLine size={14} className="ml-8 text-rose-300" />
            </div>
          ))}
        </div>
      </div>

      <section className="relative bg-white pb-8 pt-6 sm:pt-8">
        <div className="page-container relative z-[6]">
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
        <section className="relative bg-gray-50 pb-10 pt-8">
          <div className="page-container relative z-[6]">
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

      <section className="relative bg-white py-10">
        <div className="page-container relative z-[6]">
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

      <section className="relative bg-rose-50 py-10">
        <div className="page-container relative z-[6]">
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

      <section className="site-signature-cta relative overflow-hidden bg-gradient-to-r from-rose-600 to-rose-800 py-14">
        <div className="absolute inset-0 opacity-10">
          {ctaIcons.map((Icon, i) => (
            <span key={i} className="absolute" style={{ top: `${10 + i * 18}%`, left: `${i * 20}%`, transform: 'rotate(15deg)' }}>
              <Icon size={44} className="text-white" />
            </span>
          ))}
        </div>
        <div className="page-container relative z-[6] text-center">
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
            <Link
              to={`https://wa.me/${whatsapp}?text=Hello! I need help choosing return gifts.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-white px-10 py-4 text-base font-bold text-rose-700 shadow-2xl transition-all hover:bg-rose-50 hover:shadow-white/30"
            >
              <FaWhatsapp size={22} className="text-green-500" /> Chat on WhatsApp
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
