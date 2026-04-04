import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBarChart2, FiGift, FiGrid, FiLayers, FiList, FiLogOut, FiMenu, FiPackage, FiSettings, FiTrendingUp, FiUsers, FiBox, FiTool, FiImage
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  { to: '/admin/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/admin/orders', icon: FiList, label: 'Orders' },
  { to: '/admin/categories', icon: FiGrid, label: 'Categories' },
  { to: '/admin/products', icon: FiPackage, label: 'Products' },
  { to: '/admin/suppliers', icon: FiUsers, label: 'Suppliers' },
  { to: '/admin/raw-materials', icon: FiBox, label: 'Raw Materials' },
  { to: '/admin/product-bom', icon: FiLayers, label: 'Product BOM' },
  { to: '/admin/production', icon: FiTool, label: 'Production' },
  { to: '/admin/inventory', icon: FiBarChart2, label: 'Inventory' },
  { to: '/admin/offline-sales', icon: FiTrendingUp, label: 'Offline Sales' },
  { to: '/admin/hero-section', icon: FiImage, label: 'Hero Section' },
  { to: '/admin/settings', icon: FiSettings, label: 'Settings' },
];

function AdminSidebarContent({ user, handleLogout, closeSidebar }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Logo */}
      <div className="shrink-0 border-b border-brand-200/70 p-6">
        <div className="flex items-center gap-3">
          <FiGift size={24} className="text-brand-600" />
          <div>
            <p className="font-display text-sm font-bold text-gray-900">KIKI'S STORE</p>
            <p className="text-xs text-brand-600">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-200/70'
                  : 'text-gray-700 hover:bg-white hover:text-brand-600'
              }`
            }
            onClick={closeSidebar}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="shrink-0 border-t border-brand-200/70 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100">
            <span className="text-sm font-bold text-brand-700">{user?.name?.[0]}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-brand-600">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-600 transition-colors hover:bg-white hover:text-brand-600"
        >
          <FiLogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (sidebarOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  return (
    <div className="admin-shell flex h-screen overflow-hidden bg-brand-50/40">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-brand-100 bg-gradient-to-b from-[#fff7f0] via-[#fff3ea] to-[#ffe8db] lg:flex">
        <AdminSidebarContent user={user} handleLogout={handleLogout} closeSidebar={() => setSidebarOpen(false)} />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 border-r border-brand-100 bg-gradient-to-b from-[#fff7f0] via-[#fff3ea] to-[#ffe8db] lg:hidden">
              <AdminSidebarContent user={user} handleLogout={handleLogout} closeSidebar={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <button className="p-2 text-gray-600 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <FiMenu size={22} />
          </button>
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <FiGift size={18} className="text-brand-500" />
            <span className="truncate font-display text-xs font-bold text-gray-800 sm:text-sm">Admin Panel</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex min-w-0 items-center justify-end">
            <span className="truncate text-xs text-gray-600 sm:text-sm">Hello, <strong>{user?.name}</strong></span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
