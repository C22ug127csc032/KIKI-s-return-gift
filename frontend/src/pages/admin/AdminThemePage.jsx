import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiDroplet } from 'react-icons/fi';
import api from '../../api/api.js';
import { PageLoader } from '../../components/ui/index.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const themeDescriptions = {
  'kiki-classic': 'Soft rose with festive gold warmth.',
  'kiki-blush': 'Elegant blush pink theme inspired by the left side of the logo artwork.',
  'kiki-aqua': 'Fresh aqua blue theme with a polished, modern storefront feel.',
  'kiki-periwinkle': 'Soft periwinkle theme for a graceful premium look.',
  'kiki-gold': 'Warm gold-led theme with luxury accents and a festive finish.',
  'kiki-signature': 'Real four-color combined logo theme using blush pink, aqua blue, periwinkle, and soft gold across the app.',
};

export default function AdminThemePage() {
  const { theme, refreshTheme } = useTheme();
  const [presets, setPresets] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(theme.themeKey);
  const [customPrimaryRgb, setCustomPrimaryRgb] = useState({ r: 225, g: 29, b: 72 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyingThemeKey, setApplyingThemeKey] = useState('');
  const customColorInputRef = useRef(null);

  useEffect(() => {
    document.title = 'Theme - Admin';
    api.get('/theme-settings')
      .then((response) => {
        const activeTheme = response.data.data?.activeTheme || {};
        setPresets(response.data.data?.presets || []);
        setSelectedTheme(activeTheme.themeKey || 'kiki-signature');
        setCustomPrimaryRgb(activeTheme.customPrimaryRgb || { r: 225, g: 29, b: 72 });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedTheme(theme.themeKey);
  }, [theme.themeKey]);

  const deriveAccentRgb = (rgb) => ({
    r: Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.35)),
    g: Math.min(255, Math.round(rgb.g + (215 - rgb.g) * 0.18)),
    b: Math.min(255, Math.round(rgb.b + (120 - rgb.b) * 0.08)),
  });

  const handleApplyTheme = async (themeKey) => {
    setSaving(true);
    setApplyingThemeKey(themeKey);
    try {
      setSelectedTheme(themeKey);
      const derivedAccentRgb = deriveAccentRgb(customPrimaryRgb);
      await api.put('/theme-settings', themeKey === 'custom-rgb'
        ? { themeKey, customPrimaryRgb, customAccentRgb: derivedAccentRgb }
        : { themeKey });
      await refreshTheme();
      toast.success('Theme applied across the application');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update theme');
    } finally {
      setSaving(false);
      setApplyingThemeKey('');
    }
  };

  if (loading) return <PageLoader />;

  const presetOrder = ['kiki-signature', 'kiki-blush', 'kiki-aqua', 'kiki-periwinkle', 'kiki-gold', 'kiki-classic'];
  const orderedPresets = [...presets].sort((a, b) => {
    const aIndex = presetOrder.indexOf(a.key);
    const bIndex = presetOrder.indexOf(b.key);
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
    return a.name.localeCompare(b.name);
  });
  const customPrimaryColor = `rgb(${customPrimaryRgb.r}, ${customPrimaryRgb.g}, ${customPrimaryRgb.b})`;
  const customAccentRgb = deriveAccentRgb(customPrimaryRgb);
  const customAccentColor = `rgb(${customAccentRgb.r}, ${customAccentRgb.g}, ${customAccentRgb.b})`;
  const rgbToHex = ({ r, g, b }) =>
    `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
  const hexToRgb = (hex) => {
    const normalized = hex.replace('#', '');
    const fullHex = normalized.length === 3
      ? normalized.split('').map((char) => `${char}${char}`).join('')
      : normalized;

    return {
      r: Number.parseInt(fullHex.slice(0, 2), 16) || 0,
      g: Number.parseInt(fullHex.slice(2, 4), 16) || 0,
      b: Number.parseInt(fullHex.slice(4, 6), 16) || 0,
    };
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Theme</h1>
        <p className="mt-1 text-sm text-gray-500">Choose a logo-inspired color theme and apply it across the full application.</p>
      </div>

      <div className="mb-6">
        <div className={`admin-card text-left transition-all ${selectedTheme === 'custom-rgb' ? 'ring-2 ring-brand-400 border-brand-300' : 'hover:border-gray-200 hover:shadow-md'}`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Custom Color Theme</h2>
              <p className="mt-1 text-sm text-gray-500">Pick one main color and the theme will generate the rest automatically for your website.</p>
            </div>
            {theme.themeKey === 'custom-rgb' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                <FiCheckCircle size={13} /> Active
              </span>
            ) : null}
          </div>

          <div
            className="mb-5 h-24 rounded-2xl border border-gray-100"
            onClick={() => setSelectedTheme('custom-rgb')}
            style={{
              background: `linear-gradient(135deg, rgba(${customPrimaryRgb.r}, ${customPrimaryRgb.g}, ${customPrimaryRgb.b}, 0.12) 0%, rgba(${customPrimaryRgb.r}, ${customPrimaryRgb.g}, ${customPrimaryRgb.b}, 0.26) 45%, rgba(${customAccentRgb.r}, ${customAccentRgb.g}, ${customAccentRgb.b}, 0.3) 100%)`,
            }}
          />

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Theme Color</p>
                <p className="mt-1 text-sm text-gray-500">{rgbToHex(customPrimaryRgb).toUpperCase()} | RGB({customPrimaryRgb.r}, {customPrimaryRgb.g}, {customPrimaryRgb.b})</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTheme('custom-rgb');
                  customColorInputRef.current?.click();
                }}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition-all hover:border-brand-200 hover:bg-brand-50"
              >
                <span
                  className="h-10 w-10 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: customPrimaryColor }}
                />
                <span className="text-sm font-semibold text-gray-700">Pick Color</span>
              </button>
            </div>
            <input
              ref={customColorInputRef}
              type="color"
              value={rgbToHex(customPrimaryRgb)}
              onChange={(e) => {
                setCustomPrimaryRgb(hexToRgb(e.target.value));
                setSelectedTheme('custom-rgb');
              }}
              className="sr-only"
            />
          </div>

          <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <FiDroplet size={15} className="text-brand-500" /> Custom Preview
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: customPrimaryColor }}>
                Primary
              </span>
              <span className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: customPrimaryColor, color: customPrimaryColor }}>
                Outline
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `rgba(${customAccentRgb.r}, ${customAccentRgb.g}, ${customAccentRgb.b}, 0.18)`, color: customAccentColor }}>
                Accent
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSelectedTheme('custom-rgb')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                selectedTheme === 'custom-rgb' ? 'bg-brand-50 text-brand-700' : 'border border-gray-200 text-gray-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600'
              }`}
            >
              {selectedTheme === 'custom-rgb' ? 'Selected' : 'Select Custom Theme'}
            </button>
            <button
              type="button"
              onClick={() => handleApplyTheme('custom-rgb')}
              disabled={saving}
              className="btn-primary"
            >
              {saving && applyingThemeKey === 'custom-rgb' ? 'Applying...' : 'Apply Custom RGB'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {orderedPresets.map((preset) => {
          const active = selectedTheme === preset.key;
          const previewLabel = preset.key === 'kiki-signature' ? '4-Color Brand Preview' : 'Theme Preview';
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
                  background: preset.key === 'kiki-signature'
                    ? `linear-gradient(90deg, ${preset.colors.adminSidebarFrom} 0%, ${preset.colors.adminSidebarVia} 38%, ${preset.colors.adminSidebarTo} 72%, ${preset.colors.accentSoft} 100%)`
                    : `linear-gradient(135deg, ${preset.colors.adminSidebarFrom} 0%, ${preset.colors.primary100} 45%, ${preset.colors.accentSoft} 100%)`,
                }}
              />

              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3" onClick={() => setSelectedTheme(preset.key)}>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FiDroplet size={15} className="text-brand-500" /> {previewLabel}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="h-10 w-10 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: preset.colors.primary600 }}
                  />
                  <span
                    className="h-10 w-10 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: preset.colors.adminSidebarFrom }}
                  />
                  <span
                    className="h-10 w-10 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: preset.colors.adminSidebarTo }}
                  />
                  <span
                    className="h-10 w-10 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: preset.colors.accent }}
                  />
                  <span
                    className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: preset.colors.primary600 }}
                  >
                    {preset.name}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTheme(preset.key)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    active ? 'bg-brand-50 text-brand-700' : 'border border-gray-200 text-gray-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600'
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
    </div>
  );
}

