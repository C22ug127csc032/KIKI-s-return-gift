import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiShoppingBag } from 'react-icons/fi';
import { RiGiftLine } from 'react-icons/ri';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center px-4">
        <div className="w-28 h-28 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
          <RiGiftLine size={56} className="text-rose-400" />
        </div>
        <p className="font-display text-8xl font-bold text-rose-100 mb-2 select-none">404</p>
        <h1 className="font-display text-3xl font-bold text-gray-800 mb-3">Oops! Page Not Found</h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist. Maybe you were looking for a gift?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary flex items-center justify-center gap-2"><FiHome size={16} /> Go Home</Link>
          <Link to="/shop" className="btn-outline flex items-center justify-center gap-2"><FiShoppingBag size={16} /> Browse Shop</Link>
        </div>
      </motion.div>
    </div>
  );
}
