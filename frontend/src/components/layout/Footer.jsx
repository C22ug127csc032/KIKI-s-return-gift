import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiMail, FiMapPin, FiPhone, FiArrowRight, FiHeart } from 'react-icons/fi';
import { FaWhatsapp, FaFacebookF } from 'react-icons/fa';
import { RiGiftLine } from 'react-icons/ri';
import api from '../../api/api.js';

export default function Footer() {
  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';
  const [footerCategories, setFooterCategories] = useState([]);

  const quickLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/my-orders', label: 'My Orders' },
    { to: '/cart', label: 'Cart' },
    { to: '/profile', label: 'My Profile' },
  ];

  useEffect(() => {
    let isMounted = true;

    api.get('/categories/all')
      .then((response) => {
        if (!isMounted) return;
        const activeCategories = (response.data.data || [])
          .filter((category) => category?.isActive !== false)
          .slice(0, 5);
        setFooterCategories(activeCategories);
      })
      .catch(() => {
        if (isMounted) setFooterCategories([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const footerOccasions = footerCategories.length ? footerCategories : [
    { _id: 'fallback-1', name: 'Wedding Gifts' },
    { _id: 'fallback-2', name: 'Birthday Gifts' },
    { _id: 'fallback-3', name: 'Pooja Gifts' },
    { _id: 'fallback-4', name: 'Housewarming' },
    { _id: 'fallback-5', name: 'Corporate Gifts' },
  ];

  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="bg-rose-600 py-8">
        <div className="page-container flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <div>
            <h3 className="font-display text-2xl font-bold text-white">Need a Custom Gift Pack?</h3>
            <p className="mt-1 text-sm text-rose-200">Bulk orders, event gifting, personalized combos - we do it all!</p>
          </div>
          <a
            href={`https://wa.me/${whatsapp}?text=Hi! I need help with a custom gift order.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-shrink-0 items-center gap-2.5 rounded-full bg-white px-6 py-3 text-sm font-bold text-rose-700 shadow-lg transition-all hover:bg-rose-50"
          >
            <FaWhatsapp size={18} className="text-green-500" /> Chat on WhatsApp
          </a>
        </div>
      </div>

      <div className="page-container py-14">
        <div className="grid grid-cols-1 gap-10 text-center md:grid-cols-2 md:text-left lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center justify-center gap-2.5 md:justify-start">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600">
                <RiGiftLine size={20} className="text-white" />
              </div>
              <div>
                <p className="font-display text-lg font-bold leading-none text-white">KIKI'S</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Return Gift Store</p>
              </div>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-gray-400">
              India's trusted return gift store for weddings, birthdays, pooja, and every celebration. Quality you can feel, prices you'll love.
            </p>
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 transition-colors hover:bg-green-500"
              >
                <FaWhatsapp size={16} />
              </a>
              <a
                href="mailto:support@kikisstore.com"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
              >
                <FiMail size={15} />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-orange-400 transition-opacity hover:opacity-90"
              >
                <FiInstagram size={15} />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 transition-colors hover:bg-blue-500"
              >
                <FaFacebookF size={14} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-widest text-white">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="group inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-rose-400 md:flex">
                    <FiArrowRight size={12} className="-ml-1 opacity-0 transition-opacity group-hover:opacity-100" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-widest text-white">Shop by Occasion</h4>
            <ul className="space-y-2.5">
              {footerOccasions.map((category) => (
                <li key={category._id || category.name}>
                  <Link
                    to={footerCategories.length ? `/shop?category=${category._id}` : '/shop'}
                    className="group inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-rose-400 md:flex"
                  >
                    <FiArrowRight size={12} className="-ml-1 opacity-0 transition-opacity group-hover:opacity-100" />
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-widest text-white">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start justify-center gap-2.5 text-sm text-gray-400 md:justify-start">
                <FiPhone size={14} className="mt-0.5 flex-shrink-0 text-rose-400" />
                <span>+91 {whatsapp.slice(-10)}</span>
              </li>
              <li className="flex items-start justify-center gap-2.5 text-sm text-gray-400 md:justify-start">
                <FiMail size={14} className="mt-0.5 flex-shrink-0 text-rose-400" />
                <span>support@kikisstore.com</span>
              </li>
              <li className="flex items-start justify-center gap-2.5 text-sm text-gray-400 md:justify-start">
                <FiMapPin size={14} className="mt-0.5 flex-shrink-0 text-rose-400" />
                <span>Madurai, Tamil Nadu, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="page-container flex flex-col items-center justify-between gap-2 py-4 text-center text-xs text-gray-600 sm:flex-row sm:text-left">
          <p>&copy; All Rights Reserved. Powered by <span className="text-rose-500">EMATIX Embedded and Software Solutions Inc.</span></p>
          <p className="inline-flex items-center gap-1">Made with <FiHeart size={12} className="text-rose-500" /> for every celebration in India</p>
        </div>
      </div>
    </footer>
  );
}
