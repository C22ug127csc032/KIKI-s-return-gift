import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut,
  FiPackage, FiSettings, FiChevronDown, FiSearch
} from 'react-icons/fi';
import { RiGiftLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  const handleLogout = () => { logout(); setUserMenuOpen(false); navigate('/'); };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ('');
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-rose-600 shadow-[0_2px_20px_rgba(190,24,93,0.28)]' : 'bg-rose-600/95 backdrop-blur-sm border-b border-rose-500'}`}>
        <div className="page-container">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
                <RiGiftLine size={20} className="text-rose-700" />
              </div>
              <div className="leading-none">
                <p className="font-display font-bold text-white text-base tracking-tight">KIKI'S</p>
                <p className="text-[9px] text-rose-100 uppercase tracking-[0.22em] font-medium">Return Gifts</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {[{ to: '/', label: 'Home' }, { to: '/shop', label: 'Shop' }].map((l) => (
                <NavLink key={l.to} to={l.to} end={l.to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive ? 'text-rose-700 bg-white shadow-sm' : 'text-white hover:bg-white/15 hover:text-white'}`
                  }>
                  {l.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-1.5">
              <button onClick={() => setSearchOpen(true)}
                className="p-2.5 text-white hover:bg-white/15 rounded-full transition-all">
                <FiSearch size={19} />
              </button>

              <Link to="/cart" className="relative p-2.5 text-white hover:bg-white/15 rounded-full transition-all">
                <FiShoppingCart size={19} />
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
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-white/15 transition-all border border-transparent hover:border-white/20">
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center border border-white/15">
                      <span className="text-white font-bold text-xs">{user.name[0].toUpperCase()}</span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-white max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                    <FiChevronDown size={13} className={`text-rose-100 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
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
                <Link to="/login" className="bg-white text-rose-700 font-semibold py-2 px-5 rounded-full transition-all text-xs hidden sm:flex shadow-sm hover:bg-rose-50">Login</Link>
              )}

              <button className="md:hidden p-2 text-white hover:bg-white/15 rounded-full" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-rose-600 border-t border-rose-500 overflow-hidden">
              <div className="page-container py-4 flex flex-col gap-1">
                {[{ to: '/', label: 'Home' }, { to: '/shop', label: 'Shop' }].map((l) => (
                  <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => `text-sm font-medium py-2.5 px-3 rounded-xl ${isActive ? 'text-rose-700 bg-white' : 'text-white hover:bg-white/15'}`}>
                    {l.label}
                  </NavLink>
                ))}
                {!user && (
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-full transition-all text-center text-sm mt-2 px-5 py-3">
                    Login / Register
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

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
