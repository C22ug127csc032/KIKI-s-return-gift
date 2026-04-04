import ThemeSetting from '../models/ThemeSetting.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

const clampChannel = (value) => Math.min(255, Math.max(0, Number.parseInt(value, 10) || 0));
const normalizeRgb = (rgb = {}) => ({
  r: clampChannel(rgb.r),
  g: clampChannel(rgb.g),
  b: clampChannel(rgb.b),
});
const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
const rgba = ({ r, g, b }, alpha) => `rgba(${r}, ${g}, ${b}, ${alpha})`;
const mixRgb = (rgb, targetRgb, amount) => ({
  r: Math.round(rgb.r + (targetRgb.r - rgb.r) * amount),
  g: Math.round(rgb.g + (targetRgb.g - rgb.g) * amount),
  b: Math.round(rgb.b + (targetRgb.b - rgb.b) * amount),
});
const whiteRgb = { r: 255, g: 255, b: 255 };
const blackRgb = { r: 0, g: 0, b: 0 };

const buildCustomThemeColors = (primaryInput, accentInput) => {
  const primary = normalizeRgb(primaryInput);
  const accent = normalizeRgb(accentInput);

  return {
    primary50: rgbToHex(mixRgb(primary, whiteRgb, 0.92)),
    primary100: rgbToHex(mixRgb(primary, whiteRgb, 0.84)),
    primary200: rgbToHex(mixRgb(primary, whiteRgb, 0.68)),
    primary300: rgbToHex(mixRgb(primary, whiteRgb, 0.46)),
    primary400: rgbToHex(mixRgb(primary, whiteRgb, 0.22)),
    primary500: rgbToHex(mixRgb(primary, blackRgb, 0.08)),
    primary600: rgbToHex(primary),
    primary700: rgbToHex(mixRgb(primary, blackRgb, 0.16)),
    primary800: rgbToHex(mixRgb(primary, blackRgb, 0.28)),
    primary900: rgbToHex(mixRgb(primary, blackRgb, 0.42)),
    accent: rgbToHex(accent),
    accentSoft: rgbToHex(mixRgb(accent, whiteRgb, 0.78)),
    adminSidebarFrom: rgbToHex(mixRgb(primary, whiteRgb, 0.94)),
    adminSidebarVia: rgbToHex(mixRgb(primary, whiteRgb, 0.88)),
    adminSidebarTo: rgbToHex(mixRgb(primary, whiteRgb, 0.76)),
    heroGradientFrom: rgba(mixRgb(primary, blackRgb, 0.16), 0.82),
    heroGradientVia: rgba(primary, 0.58),
    heroGradientTo: 'rgba(255, 255, 255, 0)',
  };
};

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
  const { themeKey, customPrimaryRgb, customAccentRgb } = req.body;

  if (themeKey === 'custom-rgb') {
    const normalizedPrimary = normalizeRgb(customPrimaryRgb);
    const normalizedAccent = normalizeRgb(customAccentRgb);
    const themeSetting = await ensureThemeSetting();
    themeSetting.themeKey = 'custom-rgb';
    themeSetting.themeName = 'Custom RGB';
    themeSetting.customPrimaryRgb = normalizedPrimary;
    themeSetting.customAccentRgb = normalizedAccent;
    themeSetting.colors = buildCustomThemeColors(normalizedPrimary, normalizedAccent);
    await themeSetting.save();

    sendResponse(res, 200, 'Theme updated', {
      activeTheme: themeSetting,
      presets: themePresets,
    });
    return;
  }

  const selectedTheme = themePresets.find((theme) => theme.key === themeKey);

  if (!selectedTheme) {
    throw new ApiError(400, 'Selected theme is invalid');
  }

  const themeSetting = await ensureThemeSetting();
  themeSetting.themeKey = selectedTheme.key;
  themeSetting.themeName = selectedTheme.name;
  themeSetting.customPrimaryRgb = themeSetting.customPrimaryRgb || { r: 225, g: 29, b: 72 };
  themeSetting.customAccentRgb = themeSetting.customAccentRgb || { r: 245, g: 158, b: 11 };
  themeSetting.colors = selectedTheme.colors;
  await themeSetting.save();

  sendResponse(res, 200, 'Theme updated', {
    activeTheme: themeSetting,
    presets: themePresets,
  });
});
