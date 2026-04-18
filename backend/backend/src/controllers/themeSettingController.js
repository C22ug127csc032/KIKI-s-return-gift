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
];

const defaultTheme = themePresets.find((theme) => theme.key === 'kiki-classic') || themePresets[0];

const syncPresetTheme = async (themeSetting) => {
  if (!themeSetting) return themeSetting;

  const selectedTheme = themePresets.find((theme) => theme.key === themeSetting.themeKey) || defaultTheme;
  const serializedStoredColors = JSON.stringify(themeSetting.colors || {});
  const serializedPresetColors = JSON.stringify(selectedTheme.colors);

  if (
    themeSetting.themeKey !== selectedTheme.key ||
    themeSetting.themeName !== selectedTheme.name ||
    serializedStoredColors !== serializedPresetColors
  ) {
    themeSetting.themeKey = selectedTheme.key;
    themeSetting.themeName = selectedTheme.name;
    themeSetting.colors = selectedTheme.colors;
    await themeSetting.save();
  }

  return themeSetting;
};

const ensureThemeSetting = async () => {
  let themeSetting = await ThemeSetting.findOne();
  if (!themeSetting) {
    themeSetting = await ThemeSetting.create({
      themeKey: defaultTheme.key,
      themeName: defaultTheme.name,
      colors: defaultTheme.colors,
    });
  }
  return syncPresetTheme(themeSetting);
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
