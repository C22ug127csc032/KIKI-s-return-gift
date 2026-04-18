import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiGift } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext.jsx';
import FloatingField from '../../components/forms/FloatingField.jsx';

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Admin Login – KIKI\'S STORE';
    if (user?.role === 'admin') navigate('/admin/dashboard', { replace: true });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success && result.user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (result.success && result.user.role !== 'admin') {
      import('react-hot-toast').then(({ default: toast }) => toast.error('Admin access required'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiGift size={30} className="text-purple-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">KIKI'S RETURN GIFT STORE</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingField
            type="email"
            label="Admin Email"
            icon={FiMail}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="admin@kikisstore.com"
            required
          />
          <div>
            <FloatingField
              type={showPass ? 'text' : 'password'}
              label="Password"
              icon={FiLock}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Admin password"
              required
              trailing={
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="text-gray-400">
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              }
            />
            <div className="mt-2 text-right">
              <Link to="/admin/forgot-password" className="text-xs font-semibold text-purple-600 hover:text-purple-700">
                Forgot Password?
              </Link>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Login to Admin Panel'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
