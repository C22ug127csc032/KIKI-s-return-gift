import mongoose from 'mongoose';

const themeSettingSchema = new mongoose.Schema(
  {
    themeKey: { type: String, default: 'kiki-signature' },
    themeName: { type: String, default: 'Kiki Signature' },
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
      primary50: { type: String, default: '#eefafd' },
      primary100: { type: String, default: '#d7f2f8' },
      primary200: { type: String, default: '#afe3f0' },
      primary300: { type: String, default: '#7fd1e2' },
      primary400: { type: String, default: '#4eb7cf' },
      primary500: { type: String, default: '#2f9cb6' },
      primary600: { type: String, default: '#247f98' },
      primary700: { type: String, default: '#1f667a' },
      primary800: { type: String, default: '#204f5f' },
      primary900: { type: String, default: '#1f434f' },
      accent: { type: String, default: '#d4a63f' },
      accentSoft: { type: String, default: '#f6e7bf' },
      adminSidebarFrom: { type: String, default: '#fbe4ec' },
      adminSidebarVia: { type: String, default: '#e2f7fb' },
      adminSidebarTo: { type: String, default: '#e4e6fb' },
      heroGradientFrom: { type: String, default: 'rgba(235, 156, 186, 0.72)' },
      heroGradientVia: { type: String, default: 'rgba(36, 127, 152, 0.58)' },
      heroGradientTo: { type: String, default: 'rgba(138, 150, 227, 0.18)' },
    },
  },
  { timestamps: true }
);

const ThemeSetting = mongoose.model('ThemeSetting', themeSettingSchema);

export default ThemeSetting;
