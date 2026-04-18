import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiUser, FiPhone, FiMail, FiSave, FiLock, FiShield } from 'react-icons/fi';
import api from '../../api/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { isValidPhone, normalizePhone } from '../../utils/validation.js';
import FloatingField from '../../components/forms/FloatingField.jsx';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => { document.title = "Profile – KIKI'S Store"; }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (form.phone && !isValidPhone(form.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) { toast.error('Passwords do not match'); return; }
    setSavingPass(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed!');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSavingPass(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="page-container max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          {/* Avatar header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-rose-600">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full mt-1 border border-rose-100 capitalize">{user?.role}</span>
            </div>
          </div>

          <h2 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
            <FiUser size={14} className="text-rose-500" /> Edit Profile
          </h2>
          <form onSubmit={saveProfile} className="space-y-4">
            {[
              { key: 'name', label: 'Full Name', icon: FiUser, type: 'text' },
              { key: 'phone', label: 'Phone Number', icon: FiPhone, type: 'tel' },
            ].map(({ key, label, icon: Icon, type }) => (
              <FloatingField
                key={key}
                type={type}
                label={label}
                icon={Icon}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: key === 'phone' ? normalizePhone(e.target.value) : e.target.value })}
                required={key === 'name'}
              />
            ))}
            <FloatingField
              label="Email"
              icon={FiMail}
              value={user?.email}
              disabled
              className="bg-gray-50 text-gray-300 cursor-not-allowed"
            />
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 py-2.5 px-6">
              {saving
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <FiSave size={14} />}
              Save Changes
            </button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
            <FiShield size={14} className="text-rose-500" /> Change Password
          </h2>
          <form onSubmit={changePassword} className="space-y-4">
            {[
              { key: 'currentPassword', label: 'Current Password' },
              { key: 'newPassword', label: 'New Password' },
              { key: 'confirm', label: 'Confirm New Password' },
            ].map(({ key, label }) => (
              <FloatingField
                key={key}
                type="password"
                label={label}
                icon={FiLock}
                value={passForm[key]}
                onChange={(e) => setPassForm({ ...passForm, [key]: e.target.value })}
                required
              />
            ))}
            <button type="submit" disabled={savingPass} className="btn-outline flex items-center gap-2 py-2.5 px-6">
              {savingPass && <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />}
              Update Password
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
