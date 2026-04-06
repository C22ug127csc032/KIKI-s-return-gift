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
      primary50: { type: String, default: '#fbf0f5' },
      primary100: { type: String, default: '#f7dfe9' },
      primary200: { type: String, default: '#efbfd2' },
      primary300: { type: String, default: '#e394b4' },
      primary400: { type: String, default: '#cf6f97' },
      primary500: { type: String, default: '#b9547f' },
      primary600: { type: String, default: '#a3426d' },
      primary700: { type: String, default: '#863356' },
      primary800: { type: String, default: '#662844' },
      primary900: { type: String, default: '#451a2f' },
      accent: { type: String, default: '#b89342' },
      accentSoft: { type: String, default: '#e6d4ac' },
      adminSidebarFrom: { type: String, default: '#d8a8b7' },
      adminSidebarVia: { type: String, default: '#5f97a8' },
      adminSidebarTo: { type: String, default: '#7b81b6' },
      heroGradientFrom: { type: String, default: 'rgba(129, 67, 97, 0.74)' },
      heroGradientVia: { type: String, default: 'rgba(53, 109, 134, 0.62)' },
      heroGradientTo: { type: String, default: 'rgba(85, 101, 159, 0.34)' },
    },
  },
  { timestamps: true }
);

const ThemeSetting = mongoose.model('ThemeSetting', themeSettingSchema);

export default ThemeSetting;
