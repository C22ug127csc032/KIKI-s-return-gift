import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../api/api.js';
import FloatingField from '../../components/forms/FloatingField.jsx';

export default function ResetPasswordPage({ role = 'user' }) {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = role === 'admin';
  const title = isAdmin ? 'Reset Admin Password' : 'Reset Password';
  const subtitle = 'Choose a new password for your account.';
  const redirectTo = isAdmin ? '/admin/login' : '/login';
  const accentClass = isAdmin ? 'bg-slate-900 text-white' : 'bg-rose-600 text-white';
  const pageClass = useMemo(
    () => isAdmin
      ? 'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4'
      : 'min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4',
    [isAdmin]
  );
  const cardClass = isAdmin
    ? 'bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md'
    : 'bg-white rounded-3xl shadow-xl border border-rose-100 p-8 w-full max-w-md';
  const buttonClass = isAdmin
    ? 'auth-submit-btn w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60'
    : 'auth-submit-btn btn-primary w-full py-3.5 disabled:opacity-60';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Reset token is missing');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword: form.password });
      toast.success(data.message || 'Password reset successful');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
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
          <FloatingField
            type={showPassword ? 'text' : 'password'}
            label="New Password"
            icon={FiLock}
            value={form.password}
            onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
            placeholder="Enter new password"
            required
            trailing={
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="text-gray-400">
                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            }
          />

          <FloatingField
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm Password"
            icon={FiLock}
            value={form.confirmPassword}
            onChange={(e) => setForm((current) => ({ ...current, confirmPassword: e.target.value }))}
            placeholder="Confirm new password"
            required
            trailing={
              <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="text-gray-400">
                {showConfirmPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            }
          />

          <button type="submit" disabled={submitting} className={buttonClass}>
            {submitting ? 'Updating password...' : 'Reset Password'}
          </button>
        </form>

        <Link to={redirectTo} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700">
          <FiArrowLeft size={14} /> Back to login
        </Link>
      </motion.div>
    </div>
  );
}
