import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut,
  FiPackage, FiSettings, FiChevronDown, FiSearch
} from 'react-icons/fi';
import { RiHeart3Line, RiHeart3Fill } from 'react-icons/ri';
import api from '../../api/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import navbarLogo from '../../assets/navbar-logo.jpeg';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [navCategories, setNavCategories] = useState([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const desktopUserMenuRef = useRef(null);
  const mobileUserMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  useEffect(() => {
    const shouldLockScroll = menuOpen || searchOpen;
    const previousOverflow = document.body.style.overflow;
    if (shouldLockScroll) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    let active = true;

    api.get('/categories/all')
      .then((response) => {
        if (!active) return;
        setNavCategories((response.data.data || []).filter((category) => category?.isActive !== false));
      })
      .catch(() => {
        if (!active) return;
        setNavCategories([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;

    const handlePointerDown = (event) => {
      const clickedDesktopMenu = desktopUserMenuRef.current?.contains(event.target);
      const clickedMobileMenu = mobileUserMenuRef.current?.contains(event.target);

      if (!clickedDesktopMenu && !clickedMobileMenu) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [userMenuOpen]);

  const handleLogout = () => { logout(); setUserMenuOpen(false); navigate('/'); };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ('');
    }
  };

  const mobileNavLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/shop', label: 'Categories' },
    { to: '/shop', label: 'Shop' },
    ...(user ? [{ to: '/my-orders', label: 'My Orders' }] : []),
  ];

  return (
    <>
      <header className={`site-navbar fixed inset-x-0 top-0 z-[120] border-b border-black/8 bg-white transition-all duration-300 ${scrolled ? 'shadow-[0_10px_30px_rgba(15,23,42,0.08)]' : 'shadow-none'}`}>
        <div className="page-container">
          <div className="flex min-h-[68px] items-center justify-between gap-1.5 py-2 sm:h-16 sm:min-h-0 sm:gap-4 sm:py-0">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 md:hidden">
              <button className="flex-shrink-0 rounded-full p-2.5 text-gray-900 transition-colors hover:bg-black/5" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
              <Link to="/" className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2.5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-rose-200 bg-white shadow-sm sm:h-11 sm:w-11">
                  <img src={navbarLogo} alt="KIKI'S logo" className="h-full w-full object-cover" />
                </div>
                <div className="leading-none">
                  <p className="font-display text-[15px] font-bold tracking-[0.01em] text-gray-900 sm:text-xl">KIKI'S</p>
                  <p className="hidden truncate pt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-rose-500 sm:block sm:text-[10px] sm:tracking-[0.24em]">Return Gifts</p>
                </div>
              </Link>
            </div>

            <div className="hidden md:grid md:min-h-[72px] md:w-full md:grid-cols-[1fr_auto_1fr] md:items-center">
              <nav className="relative flex items-center gap-2 justify-self-start">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `site-nav-link inline-flex items-center border-b-2 px-1 py-2 text-[15px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                      isActive ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-900 hover:text-rose-600'
                    }`
                  }
                >
                  Home
                </NavLink>
                <span className="px-3 text-gray-300">|</span>
                <div
                  className="relative"
                  onMouseEnter={() => setCategoriesOpen(true)}
                  onMouseLeave={() => setCategoriesOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setCategoriesOpen((current) => !current)}
                    className={`site-nav-link inline-flex items-center border-b-2 px-1 py-2 text-[15px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                      categoriesOpen ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-900 hover:text-rose-600'
                    }`}
                  >
                    Categories
                  </button>

                  <AnimatePresence>
                    {categoriesOpen && navCategories.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute left-0 top-full z-[130] mt-4 w-[900px] max-w-[calc(100vw-80px)] rounded-[22px] border border-rose-100 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.14)]"
                      >
                        <div className="mb-5">
                          <p className="font-display text-[20px] font-bold text-gray-900">Shop by Categories</p>
                        </div>
                        <div
                          className="max-h-[360px] space-y-3 overflow-y-auto overscroll-contain pr-2"
                          onWheel={(event) => event.stopPropagation()}
                        >
                          {navCategories.map((category) => (
                            <Link
                              key={category._id}
                              to={`/shop?category=${category._id}`}
                              onClick={() => setCategoriesOpen(false)}
                              className="flex min-h-[58px] items-center justify-center rounded-2xl bg-gray-50 px-6 text-center text-[15px] font-semibold uppercase tracking-[0.08em] text-slate-800 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="px-3 text-gray-300">|</span>
                <NavLink
                  to="/shop"
                  className={({ isActive }) =>
                    `site-nav-link inline-flex items-center border-b-2 px-1 py-2 text-[15px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                      isActive ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-900 hover:text-rose-600'
                    }`
                  }
                >
                  Shop
                </NavLink>
              </nav>

              <Link to="/" className="justify-self-center">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-rose-200 bg-white shadow-sm">
                  <img src={navbarLogo} alt="KIKI'S logo" className="h-full w-full object-cover" />
                </div>
              </Link>

              <div className="flex items-center gap-1 justify-self-end">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="rounded-full p-2.5 text-gray-900 transition-all hover:bg-black/5"
                  aria-label="Search"
                >
                  <FiSearch size={18} />
                </button>

                <Link
                  to="/wishlist"
                  className="relative rounded-full p-2.5 text-gray-900 transition-all hover:bg-black/5"
                  aria-label="Wishlist"
                >
                  {wishlistItems.length > 0 ? <RiHeart3Fill size={19} /> : <RiHeart3Line size={19} />}
                  <AnimatePresence>
                    {wishlistItems.length > 0 && (
                      <motion.span
                        key="wishlist-badge-desktop"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white"
                      >
                        {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>

                <Link
                  to="/cart"
                  className="relative rounded-full p-2.5 text-gray-900 transition-all hover:bg-black/5"
                  aria-label="Cart"
                >
                  <FiShoppingCart size={18} />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        key="badge-desktop"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold leading-none text-white"
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>

                {user ? (
                  <div ref={desktopUserMenuRef} className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-gray-900 transition-all hover:bg-black/5"
                      aria-label="Profile"
                    >
                      <FiUser size={20} />
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }}
                          className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-gray-100 bg-white py-2 shadow-xl">
                          <div className="border-b border-gray-50 px-4 py-2.5">
                            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                            <p className="truncate text-xs text-gray-400">{user.email}</p>
                          </div>
                          {[
                            { to: '/profile', icon: FiUser, label: 'Profile' },
                            { to: '/wishlist', icon: wishlistItems.length > 0 ? RiHeart3Fill : RiHeart3Line, label: 'My Wishlist' },
                            { to: '/my-orders', icon: FiPackage, label: 'My Orders' },
                          ].map(({ to, icon: Icon, label }) => (
                            <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-rose-50 hover:text-rose-600">
                              <Icon size={14} /> {label}
                            </Link>
                          ))}
                          {isAdmin && (
                            <Link to="/admin/dashboard" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-purple-600 transition-colors hover:bg-purple-50">
                              <FiSettings size={14} /> Admin Panel
                            </Link>
                          )}
                          <div className="mt-1 border-t border-gray-50 pt-1">
                            <button onClick={handleLogout}
                              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50">
                              <FiLogOut size={14} /> Logout
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-gray-900 transition-all hover:bg-black/5"
                    aria-label="Login"
                  >
                    <FiUser size={20} />
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-0 sm:gap-1.5 md:hidden">
              <button onClick={() => setSearchOpen(true)}
                className="rounded-full p-1.5 text-gray-900 transition-all hover:bg-black/5 sm:p-2.5">
                <FiSearch size={16} />
              </button>

              {user ? (
                <Link to="/wishlist" className="relative rounded-full p-1.5 text-gray-900 transition-all hover:bg-black/5 sm:p-2.5">
                  {wishlistItems.length > 0 ? <RiHeart3Fill size={17} /> : <RiHeart3Line size={17} />}
                  <AnimatePresence>
                    {wishlistItems.length > 0 && (
                      <motion.span key="wishlist-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 bg-white text-rose-700 text-[10px] min-w-[20px] h-5 rounded-full flex items-center justify-center font-bold leading-none px-1">
                        {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              ) : null}

              <Link to="/cart" className="relative rounded-full p-1.5 text-gray-900 transition-all hover:bg-black/5 sm:p-2.5">
                <FiShoppingCart size={16} />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold leading-none">
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {user ? (
                <div ref={mobileUserMenuRef} className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex max-w-[40px] items-center gap-1 rounded-full border border-transparent py-1 pl-1 pr-1 transition-all hover:border-black/10 hover:bg-black/5 sm:max-w-none sm:gap-2 sm:pl-2 sm:pr-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
                      <span className="text-xs font-bold text-gray-900">{user.name[0].toUpperCase()}</span>
                    </div>
                    <span className="hidden max-w-[80px] truncate text-sm font-medium text-gray-900 sm:block">{user.name.split(' ')[0]}</span>
                    <FiChevronDown size={13} className={`hidden text-gray-500 transition-transform sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                        <div className="px-4 py-2.5 border-b border-gray-50">
                          <p className="font-semibold text-sm text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        {[
                          { to: '/profile', icon: FiUser, label: 'Profile' },
                          { to: '/wishlist', icon: wishlistItems.length > 0 ? RiHeart3Fill : RiHeart3Line, label: 'My Wishlist' },
                          { to: '/my-orders', icon: FiPackage, label: 'My Orders' },
                        ].map(({ to, icon: Icon, label }) => (
                          <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                            <Icon size={14} /> {label}
                          </Link>
                        ))}
                        {isAdmin && (
                          <Link to="/admin/dashboard" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors">
                            <FiSettings size={14} /> Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-gray-50 mt-1 pt-1">
                          <button onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                            <FiLogOut size={14} /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login" className="site-login-pill flex whitespace-nowrap rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-gray-900 shadow-sm transition-all hover:bg-gray-50 sm:px-5 sm:text-xs">
                  Login
                </Link>
              )}

            </div>
          </div>
        </div>

      </header>
      <div className="h-[68px] sm:h-16" aria-hidden="true" />
      <AnimatePresence>
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-[60]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="site-navbar-drawer absolute left-0 top-0 bottom-0 w-[82vw] max-w-[320px] bg-rose-600 shadow-2xl border-r border-rose-500"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white shadow-sm">
                    <img src={navbarLogo} alt="KIKI'S logo" className="h-full w-full object-cover" />
                  </div>
                  <div className="leading-none">
                    <p className="font-display font-bold text-white text-base tracking-tight">KIKI'S</p>
                    <p className="text-[9px] text-rose-100 uppercase tracking-[0.22em] font-medium">Return Gifts</p>
                  </div>
                </div>
                <button className="p-2 text-white hover:bg-white/15 rounded-full" onClick={() => setMenuOpen(false)}>
                  <FiX size={20} />
                </button>
              </div>

              <div className="px-4 py-4 flex flex-col gap-1">
                {user ? (
                  <div className="mb-3 rounded-2xl bg-white/10 border border-white/10 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/15 flex-shrink-0">
                        <span className="text-white font-bold text-sm">{user.name[0].toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <p className="text-xs text-rose-100 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {mobileNavLinks.map((l, index) => (
                  <NavLink
                    key={`${l.to}-${l.label}-${index}`}
                    to={l.to}
                    end={l.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => `site-mobile-nav-link text-sm font-medium py-3 px-4 rounded-2xl ${isActive ? 'site-mobile-nav-link-active text-rose-700 bg-white' : 'text-white hover:bg-white/15'}`}
                  >
                    {l.label}
                  </NavLink>
                ))}
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-medium py-3 px-4 rounded-2xl text-white hover:bg-white/15 flex items-center gap-2.5"
                    >
                      <FiUser size={16} /> Profile
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-medium py-3 px-4 rounded-2xl text-white hover:bg-white/15 flex items-center gap-2.5"
                    >
                      {wishlistItems.length > 0 ? <RiHeart3Fill size={16} /> : <RiHeart3Line size={16} />} My Wishlist
                    </Link>
                    <Link
                      to="/my-orders"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-medium py-3 px-4 rounded-2xl text-white hover:bg-white/15 flex items-center gap-2.5"
                    >
                      <FiPackage size={16} /> My Orders
                    </Link>
                    {isAdmin ? (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="text-sm font-medium py-3 px-4 rounded-2xl text-white hover:bg-white/15 flex items-center gap-2.5"
                      >
                        <FiSettings size={16} /> Admin Panel
                      </Link>
                    ) : null}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="text-sm font-medium py-3 px-4 rounded-2xl text-white hover:bg-white/15 flex items-center gap-2.5 text-left"
                    >
                      <FiLogOut size={16} /> Logout
                    </button>
                  </>
                ) : null}
                {!user && (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="site-login-pill bg-white text-rose-700 font-semibold rounded-full transition-all text-center text-sm mt-3 px-5 py-3"
                  >
                    Login / Register
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-start justify-center pt-24 px-4"
            onClick={() => setSearchOpen(false)}>
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
              <form onSubmit={handleSearch} className="flex items-center gap-3 px-5 py-4">
                <FiSearch size={20} className="text-gray-400 flex-shrink-0" />
                <input ref={searchRef} value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search for gifts, occasions, categories..."
                  className="flex-1 text-base text-gray-800 placeholder-gray-400 outline-none bg-transparent" />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <FiX size={18} />
                </button>
              </form>
              <div className="border-t border-gray-100 px-5 py-3">
                <p className="text-xs text-gray-400 font-medium mb-2">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Wedding gifts', 'Birthday return gifts', 'Diwali gifts', 'Combo packs'].map((q) => (
                    <button key={q} onClick={() => { navigate(`/shop?search=${encodeURIComponent(q)}`); setSearchOpen(false); }}
                      className="text-xs bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full hover:bg-rose-100 transition-colors font-medium">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
