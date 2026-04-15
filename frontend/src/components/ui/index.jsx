import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiGift, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export function Loader({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} border-[3px] border-rose-100 border-t-rose-600 rounded-full animate-spin`} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader size="lg" />
        <p className="mt-3 text-gray-400 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="bg-gray-100 aspect-square" />
      <div className="p-3.5">
        <div className="bg-gray-100 h-2.5 rounded-full w-1/3 mb-2.5" />
        <div className="bg-gray-100 h-3.5 rounded-full w-full mb-1.5" />
        <div className="bg-gray-100 h-3.5 rounded-full w-3/4 mb-3" />
        <div className="flex justify-between items-center">
          <div className="bg-gray-100 h-5 rounded-full w-16" />
          <div className="bg-gray-100 h-8 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
}

export function Badge({ status, type, label }) {
  const orderColors = {
    Pending: 'badge-yellow', Confirmed: 'badge-blue', Processing: 'badge-blue',
    Shipped: 'badge-orange', Completed: 'badge-green', Cancelled: 'badge-red',
  };
  const payColors = { Paid: 'badge-green', Pending: 'badge-yellow', Failed: 'badge-red', Refunded: 'badge-blue' };
  const cls = type === 'payment' ? payColors[status] || 'badge-gray' : orderColors[status] || 'badge-gray';
  return <span className={cls}>{label ? `${label}: ${status}` : status}</span>;
}

export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex items-center justify-center gap-5 text-sm">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="font-medium text-rose-600 transition-colors hover:text-rose-700 disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-50"
      >
        Prev
      </button>
      <div className="font-medium text-gray-900">
        Page {currentPage} of {totalPages}
      </div>
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="font-medium text-rose-600 transition-colors hover:text-rose-700 disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export function EmptyState({ icon = <FiGift size={48} />, title = 'Nothing here yet', message = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-300 mb-5 mx-auto">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      {message && <p className="text-sm text-gray-400 max-w-xs leading-relaxed">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto z-10`}>
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">{title}</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <FiX size={18} />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SectionTitle({ title, subtitle, center = false }) {
  return (
    <div className={`mb-10 ${center ? 'text-center' : ''}`}>
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="mt-2 text-gray-500 text-base">{subtitle}</p>}
    </div>
  );
}
