import ThemeSetting from '../models/ThemeSetting.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

export const themePresets = [
  {
    key: 'kiki-classic',
    name: 'Kiki Classic',
    colors: {
      primary50: '#fff1f2',
      primary100: '#ffe4e6',
      primary200: '#fecdd3',
      primary300: '#fda4af',
      primary400: '#fb7185',
      primary500: '#f43f5e',
      primary600: '#e11d48',
      primary700: '#be123c',
      primary800: '#9f1239',
      primary900: '#881337',
      accent: '#f59e0b',
      accentSoft: '#fef3c7',
      adminSidebarFrom: '#fff7f0',
      adminSidebarVia: '#fff3ea',
      adminSidebarTo: '#ffe8db',
      heroGradientFrom: 'rgba(190, 24, 93, 0.8)',
      heroGradientVia: 'rgba(225, 29, 72, 0.6)',
      heroGradientTo: 'rgba(255, 255, 255, 0)',
    },
  },
  {
    key: 'blue-ribbon',
    name: 'Blue Ribbon',
    colors: {
      primary50: '#eff6ff',
      primary100: '#dbeafe',
      primary200: '#bfdbfe',
      primary300: '#93c5fd',
      primary400: '#60a5fa',
      primary500: '#3b82f6',
      primary600: '#2563eb',
      primary700: '#1d4ed8',
      primary800: '#1e40af',
      primary900: '#1e3a8a',
      accent: '#fbbf24',
      accentSoft: '#fef3c7',
      adminSidebarFrom: '#f2f8ff',
      adminSidebarVia: '#ebf4ff',
      adminSidebarTo: '#ddefff',
      heroGradientFrom: 'rgba(29, 78, 216, 0.82)',
      heroGradientVia: 'rgba(37, 99, 235, 0.58)',
      heroGradientTo: 'rgba(255, 255, 255, 0)',
    },
  },
  {
    key: 'pastel-bloom',
    name: 'Pastel Bloom',
    colors: {
      primary50: '#fdf2f8',
      primary100: '#fce7f3',
      primary200: '#fbcfe8',
      primary300: '#f9a8d4',
      primary400: '#f472b6',
      primary500: '#ec4899',
      primary600: '#db2777',
      primary700: '#be185d',
      primary800: '#9d174d',
      primary900: '#831843',
      accent: '#06b6d4',
      accentSoft: '#cffafe',
      adminSidebarFrom: '#fff6fb',
      adminSidebarVia: '#fdf0ff',
      adminSidebarTo: '#eef7ff',
      heroGradientFrom: 'rgba(190, 24, 93, 0.78)',
      heroGradientVia: 'rgba(6, 182, 212, 0.34)',
      heroGradientTo: 'rgba(255, 255, 255, 0)',
    },
  },
  {
    key: 'mint-celebration',
    name: 'Mint Celebration',
    colors: {
      primary50: '#ecfdf5',
      primary100: '#d1fae5',
      primary200: '#a7f3d0',
      primary300: '#6ee7b7',
      primary400: '#34d399',
      primary500: '#10b981',
      primary600: '#059669',
      primary700: '#047857',
      primary800: '#065f46',
      primary900: '#064e3b',
      accent: '#f59e0b',
      accentSoft: '#fef3c7',
      adminSidebarFrom: '#f2fff9',
      adminSidebarVia: '#ecfff7',
      adminSidebarTo: '#dcfce7',
      heroGradientFrom: 'rgba(5, 150, 105, 0.8)',
      heroGradientVia: 'rgba(16, 185, 129, 0.52)',
      heroGradientTo: 'rgba(255, 255, 255, 0)',
    },
  },
];

const defaultTheme = themePresets[0];

const ensureThemeSetting = async () => {
  let themeSetting = await ThemeSetting.findOne();
  if (!themeSetting) {
    themeSetting = await ThemeSetting.create({
      themeKey: defaultTheme.key,
      themeName: defaultTheme.name,
      colors: defaultTheme.colors,
    });
  }
  return themeSetting;
};

export const getThemeSetting = asyncHandler(async (_req, res) => {
  const themeSetting = await ensureThemeSetting();
  sendResponse(res, 200, 'Theme setting fetched', {
    activeTheme: themeSetting,
    presets: themePresets,
  });
});

export const updateThemeSetting = asyncHandler(async (req, res) => {
  const { themeKey } = req.body;
  const selectedTheme = themePresets.find((theme) => theme.key === themeKey);

  if (!selectedTheme) {
    throw new ApiError(400, 'Selected theme is invalid');
  }

  const themeSetting = await ensureThemeSetting();
  themeSetting.themeKey = selectedTheme.key;
  themeSetting.themeName = selectedTheme.name;
  themeSetting.colors = selectedTheme.colors;
  await themeSetting.save();

  sendResponse(res, 200, 'Theme updated', {
    activeTheme: themeSetting,
    presets: themePresets,
  });
});
