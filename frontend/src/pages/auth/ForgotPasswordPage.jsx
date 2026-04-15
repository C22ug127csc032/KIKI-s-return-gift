import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiLock, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../api/api.js';
import { isValidEmail } from '../../utils/validation.js';

export default function ForgotPasswordPage({ role = 'user' }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = role === 'admin';
  const title = isAdmin ? 'Admin Forgot Password' : 'Forgot Password';
  const subtitle = isAdmin
    ? 'Enter your admin email and we will send a secure reset link.'
    : 'Enter your account email and we will send a secure reset link.';
  const backTo = isAdmin ? '/admin/login' : '/login';

  const pageClass = useMemo(
    () => isAdmin
      ? 'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4'
      : 'min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4',
    [isAdmin]
  );

  const cardClass = isAdmin
    ? 'bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md'
    : 'bg-white rounded-3xl shadow-xl border border-rose-100 p-8 w-full max-w-md';

  const accentClass = isAdmin ? 'bg-slate-900 text-white' : 'bg-rose-600 text-white';
  const buttonClass = isAdmin
    ? 'w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60'
    : 'btn-primary w-full py-3.5 disabled:opacity-60';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error('Enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email, role });
      toast.success(data.message || 'Reset link sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={pageClass}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
        <div className="mb-8 text-center">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${accentClass}`}>
            <FiLock size={26} />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAdmin ? 'admin@kikisstore.com' : 'your@email.com'}
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className={buttonClass}>
            {submitting ? 'Sending reset link...' : 'Send Reset Link'}
          </button>
        </form>

        <Link to={backTo} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700">
          <FiArrowLeft size={14} /> Back to login
        </Link>
      </motion.div>
    </div>
  );
}
