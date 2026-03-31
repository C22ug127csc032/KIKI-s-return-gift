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

  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="bg-rose-600 py-8">
        <div className="page-container flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <h3 className="font-display text-2xl text-white font-bold">Need a Custom Gift Pack?</h3>
            <p className="text-rose-200 text-sm mt-1">Bulk orders, event gifting, personalized combos - we do it all!</p>
          </div>
          <a
            href={`https://wa.me/${whatsapp}?text=Hi! I need help with a custom gift order.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-white text-rose-700 font-bold px-6 py-3 rounded-full hover:bg-rose-50 transition-all shadow-lg text-sm flex-shrink-0"
          >
            <FaWhatsapp size={18} className="text-green-500" /> Chat on WhatsApp
          </a>
        </div>
      </div>

      <div className="page-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-center md:text-left">
          <div className="lg:col-span-1">
            <div className="flex items-center justify-center md:justify-start gap-2.5 mb-4">
              <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center">
                <RiGiftLine size={20} className="text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-white text-lg leading-none">KIKI'S</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Return Gift Store</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              India's trusted return gift store for weddings, birthdays, pooja, and every celebration. Quality you can feel, prices you'll love.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center hover:bg-green-500 transition-colors"
              >
                <FaWhatsapp size={16} />
              </a>
              <a
                href="mailto:support@kikisstore.com"
                className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <FiMail size={15} />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-gradient-to-br from-pink-600 to-orange-400 rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <FiInstagram size={15} />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-500 transition-colors"
              >
                <FaFacebookF size={14} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-rose-400 inline-flex md:flex items-center gap-1.5 transition-colors group">
                    <FiArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">Shop by Occasion</h4>
            <ul className="space-y-2.5">
              {(footerCategories.length ? footerCategories : [
                { _id: 'fallback-1', name: 'Wedding Gifts' },
                { _id: 'fallback-2', name: 'Birthday Gifts' },
                { _id: 'fallback-3', name: 'Pooja Gifts' },
                { _id: 'fallback-4', name: 'Housewarming' },
                { _id: 'fallback-5', name: 'Corporate Gifts' },
              ]).map((category) => (
                <li key={category._id || category.name}>
                  <Link to={footerCategories.length ? `/shop?category=${category._id}` : '/shop'} className="text-sm text-gray-400 hover:text-rose-400 inline-flex md:flex items-center gap-1.5 transition-colors group">
                    <FiArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start justify-center md:justify-start gap-2.5 text-sm text-gray-400">
                <FiPhone size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
                <span>+91 {whatsapp.slice(-10)}</span>
              </li>
              <li className="flex items-start justify-center md:justify-start gap-2.5 text-sm text-gray-400">
                <FiMail size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
                <span>support@kikisstore.com</span>
              </li>
              <li className="flex items-start justify-center md:justify-start gap-2.5 text-sm text-gray-400">
                <FiMapPin size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
                <span>Madurai, Tamil Nadu, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="page-container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600 text-center sm:text-left">
          <p>© All Rights Reserved. Powered by EMATIX Embedded and Software Solutions Inc.</p>
          <p className="inline-flex items-center gap-1">Made with <FiHeart size={12} className="text-rose-500" /> for every celebration in India</p>
        </div>
      </div>
    </footer>
  );
}
