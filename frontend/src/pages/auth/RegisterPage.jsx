import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { RiGiftLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext.jsx';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const { register, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Register – KIKI'S Store";
    if (user) navigate('/');
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { alert('Passwords do not match'); return; }
    const result = await register(form.name, form.email, form.password, form.phone);
    if (result.success) navigate('/');
  };

  const fields = [
    { key: 'name', label: 'Full Name', icon: FiUser, type: 'text', placeholder: 'Your full name' },
    { key: 'email', label: 'Email Address', icon: FiMail, type: 'email', placeholder: 'your@email.com' },
    { key: 'phone', label: 'Phone Number', icon: FiPhone, type: 'tel', placeholder: '+91 XXXXXXXXXX' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl border border-rose-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <RiGiftLine size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Join KIKI'S and start gifting!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder} className="input-field pl-10" required={key !== 'phone'} />
              </div>
            </div>
          ))}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
              <input type={showPass ? 'text' : 'password'} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters" className="input-field pl-10 pr-10" required minLength={6} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Confirm Password</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
              <input type="password" value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Re-enter password" className="input-field pl-10" required />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-60">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-rose-600 font-bold hover:text-rose-700">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
