import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiDroplet } from 'react-icons/fi';
import api from '../../api/api.js';
import { PageLoader } from '../../components/ui/index.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function AdminThemePage() {
  const { theme, refreshTheme } = useTheme();
  const [presets, setPresets] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(theme.themeKey);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Theme - Admin';
    api.get('/theme-settings')
      .then((response) => {
        setPresets(response.data.data?.presets || []);
        setSelectedTheme(response.data.data?.activeTheme?.themeKey || 'kiki-classic');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedTheme(theme.themeKey);
  }, [theme.themeKey]);

  const handleApplyTheme = async () => {
    setSaving(true);
    try {
      await api.put('/theme-settings', { themeKey: selectedTheme });
      await refreshTheme();
      toast.success('Theme applied across the application');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update theme');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Theme</h1>
        <p className="mt-1 text-sm text-gray-500">Choose a logo-inspired color theme and apply it across the full application.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {presets.map((preset) => {
          const active = selectedTheme === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => setSelectedTheme(preset.key)}
              className={`admin-card text-left transition-all ${active ? 'ring-2 ring-brand-400 border-brand-300' : 'hover:border-gray-200 hover:shadow-md'}`}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{preset.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {preset.key === 'kiki-classic' ? 'Soft rose with festive gold warmth.' : null}
                    {preset.key === 'blue-ribbon' ? 'Sky blue inspired by the ribbon in the logo.' : null}
                    {preset.key === 'pastel-bloom' ? 'Pink and aqua blend from the logo artwork.' : null}
                    {preset.key === 'mint-celebration' ? 'Fresh mint palette with festive contrast.' : null}
                  </p>
                </div>
                {theme.themeKey === preset.key ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    <FiCheckCircle size={13} /> Active
                  </span>
                ) : null}
              </div>

              <div
                className="mb-5 h-24 rounded-2xl border border-gray-100"
                style={{
                  background: `linear-gradient(135deg, ${preset.colors.adminSidebarFrom} 0%, ${preset.colors.primary100} 45%, ${preset.colors.accentSoft} 100%)`,
                }}
              />

              <div className="mb-5 flex flex-wrap gap-2">
                {[
                  preset.colors.primary300,
                  preset.colors.primary500,
                  preset.colors.primary600,
                  preset.colors.primary700,
                  preset.colors.accent,
                ].map((color) => (
                  <span
                    key={color}
                    className="h-10 w-10 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FiDroplet size={15} className="text-brand-500" /> Theme Preview
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: preset.colors.primary600 }}
                  >
                    Primary
                  </span>
                  <span
                    className="rounded-full border px-4 py-2 text-sm font-semibold"
                    style={{ borderColor: preset.colors.primary600, color: preset.colors.primary600 }}
                  >
                    Outline
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: preset.colors.accentSoft, color: preset.colors.accent }}
                  >
                    Accent
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <button onClick={handleApplyTheme} disabled={saving} className="btn-primary">
          {saving ? 'Applying Theme...' : 'Apply Selected Theme'}
        </button>
      </div>
    </div>
  );
}
