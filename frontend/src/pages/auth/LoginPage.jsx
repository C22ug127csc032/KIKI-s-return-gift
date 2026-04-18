import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { RiGiftLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext.jsx';
import FloatingField from '../../components/forms/FloatingField.jsx';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    document.title = "Login – KIKI'S Store";
    if (user) navigate(user.role === 'admin' ? '/admin/dashboard' : from, { replace: true });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) navigate(result.user.role === 'admin' ? '/admin/dashboard' : from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl border border-rose-100 p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <RiGiftLine size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your KIKI'S account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingField
            type="email"
            label="Email"
            icon={FiMail}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <div>
            <FloatingField
              type={showPass ? 'text' : 'password'}
              label="Password"
              icon={FiLock}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              trailing={
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="text-gray-400 hover:text-gray-600">
                  {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              }
            />
            <div className="mt-2 text-right">
              <Link to="/forgot-password" className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                Forgot Password?
              </Link>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-60">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-rose-600 font-bold hover:text-rose-700">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
