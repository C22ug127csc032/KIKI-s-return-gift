import mongoose from 'mongoose';

const themeSettingSchema = new mongoose.Schema(
  {
    themeKey: { type: String, default: 'kiki-classic' },
    themeName: { type: String, default: 'Kiki Classic' },
    useCustomColors: { type: Boolean, default: false },
    customPrimaryHex: { type: String, default: '#e11d48' },
    customAccentHex: { type: String, default: '#f59e0b' },
    customPrimaryRgb: {
      r: { type: Number, default: 225 },
      g: { type: Number, default: 29 },
      b: { type: Number, default: 72 },
    },
    customAccentRgb: {
      r: { type: Number, default: 245 },
      g: { type: Number, default: 158 },
      b: { type: Number, default: 11 },
    },
    colors: {
      primary50: { type: String, default: '#fff1f2' },
      primary100: { type: String, default: '#ffe4e6' },
      primary200: { type: String, default: '#fecdd3' },
      primary300: { type: String, default: '#fda4af' },
      primary400: { type: String, default: '#fb7185' },
      primary500: { type: String, default: '#f43f5e' },
      primary600: { type: String, default: '#e11d48' },
      primary700: { type: String, default: '#be123c' },
      primary800: { type: String, default: '#9f1239' },
      primary900: { type: String, default: '#881337' },
      accent: { type: String, default: '#f59e0b' },
      accentSoft: { type: String, default: '#fef3c7' },
      adminSidebarFrom: { type: String, default: '#fff7f0' },
      adminSidebarVia: { type: String, default: '#fff3ea' },
      adminSidebarTo: { type: String, default: '#ffe8db' },
      heroGradientFrom: { type: String, default: 'rgba(190, 24, 93, 0.8)' },
      heroGradientVia: { type: String, default: 'rgba(225, 29, 72, 0.6)' },
      heroGradientTo: { type: String, default: 'rgba(255, 255, 255, 0)' },
    },
  },
  { timestamps: true }
);

const ThemeSetting = mongoose.model('ThemeSetting', themeSettingSchema);

export default ThemeSetting;
