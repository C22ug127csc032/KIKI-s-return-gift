import mongoose from 'mongoose';

const themeSettingSchema = new mongoose.Schema(
  {
    themeKey: { type: String, default: 'kiki-signature' },
    themeName: { type: String, default: 'Kiki 4-Color Signature' },
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
      primary50: { type: String, default: '#fff7fb' },
      primary100: { type: String, default: '#fbeaf3' },
      primary200: { type: String, default: '#f6d5e6' },
      primary300: { type: String, default: '#eeadc9' },
      primary400: { type: String, default: '#e98fb1' },
      primary500: { type: String, default: '#78cada' },
      primary600: { type: String, default: '#5dc3d5' },
      primary700: { type: String, default: '#4aa7c0' },
      primary800: { type: String, default: '#6c88d9' },
      primary900: { type: String, default: '#2f2444' },
      accent: { type: String, default: '#ddb457' },
      accentSoft: { type: String, default: '#f7e9ad' },
      adminSidebarFrom: { type: String, default: '#efabc0' },
      adminSidebarVia: { type: String, default: '#6fd6e6' },
      adminSidebarTo: { type: String, default: '#a1a7f4' },
      heroGradientFrom: { type: String, default: 'rgba(239, 171, 192, 0.92)' },
      heroGradientVia: { type: String, default: 'rgba(111, 214, 230, 0.9)' },
      heroGradientTo: { type: String, default: 'rgba(247, 233, 173, 0.84)' },
    },
  },
  { timestamps: true }
);

const ThemeSetting = mongoose.model('ThemeSetting', themeSettingSchema);

export default ThemeSetting;
