import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiDroplet } from 'react-icons/fi';
import api from '../../api/api.js';
import { PageLoader } from '../../components/ui/index.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const themeDescriptions = {
  'kiki-classic': 'Soft rose with festive gold warmth.',
};

const normalizeHexColor = (value, fallback) => {
  const normalized = String(value || '').trim();
  return /^#([A-Fa-f0-9]{6})$/.test(normalized) ? normalized : fallback;
};

export default function AdminThemePage() {
  const { theme, refreshTheme } = useTheme();
  const [presets, setPresets] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(theme.themeKey);
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#e11d48');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyingThemeKey, setApplyingThemeKey] = useState('');

  useEffect(() => {
    document.title = 'Theme - Admin';
    api.get('/theme-settings')
      .then((response) => {
        const activeTheme = response.data.data?.activeTheme || {};
        setPresets(response.data.data?.presets || []);
        setSelectedTheme(activeTheme.themeKey || 'kiki-classic');
        setUseCustomColors(Boolean(activeTheme.useCustomColors));
        setPrimaryColor(normalizeHexColor(activeTheme.customPrimaryHex, activeTheme.colors?.primary600 || '#e11d48'));
        setAccentColor(normalizeHexColor(activeTheme.customAccentHex, activeTheme.colors?.accent || '#f59e0b'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedTheme(theme.themeKey);
    setUseCustomColors(Boolean(theme.useCustomColors));
    setPrimaryColor(normalizeHexColor(theme.customPrimaryHex, theme.colors?.primary600 || '#e11d48'));
    setAccentColor(normalizeHexColor(theme.customAccentHex, theme.colors?.accent || '#f59e0b'));
  }, [theme]);

  const handleApplyTheme = async (themeKey) => {
    setSaving(true);
    setApplyingThemeKey(themeKey);
    try {
      setSelectedTheme(themeKey);
      await api.put('/theme-settings', {
        themeKey,
        useCustomColors,
        primaryColor,
        accentColor,
      });
      await refreshTheme();
      toast.success(useCustomColors ? 'Custom theme colors applied' : 'Theme applied across the application');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update theme');
    } finally {
      setSaving(false);
      setApplyingThemeKey('');
    }
  };

  if (loading) return <PageLoader />;

  const orderedPresets = [...presets].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Theme</h1>
        <p className="mt-1 text-sm text-gray-500">The admin module now keeps a single classic color theme across the full application.</p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {orderedPresets.map((preset) => {
          const active = selectedTheme === preset.key;
          return (
            <div
              key={preset.key}
              className={`admin-card text-left transition-all ${active ? 'ring-2 ring-brand-400 border-brand-300' : 'hover:border-gray-200 hover:shadow-md'}`}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{preset.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{themeDescriptions[preset.key] || 'Custom preset theme for the storefront.'}</p>
                </div>
                {theme.themeKey === preset.key ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    <FiCheckCircle size={13} /> Active
                  </span>
                ) : null}
              </div>

              <div
                className="mb-5 h-24 rounded-2xl border border-gray-100"
                onClick={() => setSelectedTheme(preset.key)}
                style={{
                  background: useCustomColors
                    ? `linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}55 45%, ${accentColor}44 100%)`
                    : `linear-gradient(135deg, ${preset.colors.adminSidebarFrom} 0%, ${preset.colors.primary100} 45%, ${preset.colors.accentSoft} 100%)`,
                }}
              />

              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3" onClick={() => setSelectedTheme(preset.key)}>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FiDroplet size={15} className="text-brand-500" /> Theme Preview
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="h-10 w-10 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: useCustomColors ? primaryColor : preset.colors.primary600 }}
                  />
                  <span
                    className="h-10 w-10 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: useCustomColors ? `${primaryColor}33` : preset.colors.adminSidebarFrom }}
                  />
                  <span
                    className="h-10 w-10 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: useCustomColors ? `${accentColor}33` : preset.colors.adminSidebarTo }}
                  />
                  <span
                    className="h-10 w-10 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: useCustomColors ? accentColor : preset.colors.accent }}
                  />
                  <span
                    className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: useCustomColors ? primaryColor : preset.colors.primary600 }}
                  >
                    {useCustomColors ? 'Custom Colors' : preset.name}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTheme(preset.key)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    active ? 'bg-brand-50 text-brand-700' : 'border border-gray-200 text-gray-600'
                  }`}
                >
                  {active ? 'Selected' : 'Select Theme'}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTheme(preset.key)}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving && applyingThemeKey === preset.key ? 'Applying...' : 'Apply Theme'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-card mt-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Color Picker</h2>
            <p className="mt-1 text-sm text-gray-500">Customize the selected theme with your own primary and accent colors.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={useCustomColors}
              onChange={(event) => setUseCustomColors(event.target.checked)}
              className="h-4 w-4 rounded text-brand-500"
            />
            Use custom colors
          </label>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700">
            <FiDroplet size={15} className="text-brand-500" /> Custom Color Preview
          </div>

          <div
            className="mb-4 h-24 rounded-2xl border border-gray-100"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}55 45%, ${accentColor}44 100%)`,
            }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <span
              className="h-10 w-10 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
            />
            <span
              className="h-10 w-10 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: `${primaryColor}33` }}
            />
            <span
              className="h-10 w-10 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: `${accentColor}33` }}
            />
            <span
              className="h-10 w-10 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Custom Colors
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Primary Color</span>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                className="h-11 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
              />
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">{primaryColor}</span>
            </div>
          </label>
          <label className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Accent Color</span>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(event) => setAccentColor(event.target.value)}
                className="h-11 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
              />
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">{accentColor}</span>
            </div>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            onClick={() => handleApplyTheme(selectedTheme)}
            disabled={saving}
            className="btn-primary"
          >
            {saving && applyingThemeKey === selectedTheme ? 'Applying...' : 'Apply Custom Colors'}
          </button>
        </div>
      </div>
    </div>
  );
}

