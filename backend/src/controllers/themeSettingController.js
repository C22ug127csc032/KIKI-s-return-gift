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
  {
    key: 'kiki-blush',
    name: 'Kiki Blush',
    colors: {
      primary50: '#fff4f8',
      primary100: '#ffe8f0',
      primary200: '#ffcfe1',
      primary300: '#ffaccb',
      primary400: '#fc7fad',
      primary500: '#f55a92',
      primary600: '#e4417c',
      primary700: '#c32e66',
      primary800: '#a22856',
      primary900: '#7f2449',
      accent: '#d7a74a',
      accentSoft: '#f6e8c5',
      adminSidebarFrom: '#fff7fa',
      adminSidebarVia: '#ffeef4',
      adminSidebarTo: '#ffe3ec',
      heroGradientFrom: 'rgba(228, 65, 124, 0.8)',
      heroGradientVia: 'rgba(252, 127, 173, 0.54)',
      heroGradientTo: 'rgba(255, 255, 255, 0.06)',
    },
  },
  {
    key: 'kiki-aqua',
    name: 'Kiki Aqua',
    colors: {
      primary50: '#effbfd',
      primary100: '#d9f4f9',
      primary200: '#b5e7f1',
      primary300: '#84d7e5',
      primary400: '#53c2d4',
      primary500: '#33a8bd',
      primary600: '#26889d',
      primary700: '#216d7f',
      primary800: '#225766',
      primary900: '#214955',
      accent: '#cfa85a',
      accentSoft: '#f2e6c8',
      adminSidebarFrom: '#f4fdff',
      adminSidebarVia: '#e9f9fc',
      adminSidebarTo: '#d9f1f6',
      heroGradientFrom: 'rgba(38, 136, 157, 0.78)',
      heroGradientVia: 'rgba(83, 194, 212, 0.48)',
      heroGradientTo: 'rgba(255, 255, 255, 0.08)',
    },
  },
  {
    key: 'kiki-periwinkle',
    name: 'Kiki Periwinkle',
    colors: {
      primary50: '#f3f4ff',
      primary100: '#e8eaff',
      primary200: '#d4d7ff',
      primary300: '#b7bcff',
      primary400: '#949afb',
      primary500: '#767ce8',
      primary600: '#6267ce',
      primary700: '#5355ab',
      primary800: '#46478a',
      primary900: '#3d3f70',
      accent: '#d6ac59',
      accentSoft: '#f5e8c5',
      adminSidebarFrom: '#f8f8ff',
      adminSidebarVia: '#eff1ff',
      adminSidebarTo: '#e4e6fb',
      heroGradientFrom: 'rgba(98, 103, 206, 0.78)',
      heroGradientVia: 'rgba(148, 154, 251, 0.46)',
      heroGradientTo: 'rgba(255, 255, 255, 0.06)',
    },
  },
  {
    key: 'kiki-gold',
    name: 'Kiki Gold',
    colors: {
      primary50: '#fffaf0',
      primary100: '#fff2d9',
      primary200: '#fbe3ae',
      primary300: '#f3d07c',
      primary400: '#e8b955',
      primary500: '#d7a33f',
      primary600: '#bb8732',
      primary700: '#956827',
      primary800: '#775120',
      primary900: '#61431d',
      accent: '#247f98',
      accentSoft: '#d8edf3',
      adminSidebarFrom: '#fffaf2',
      adminSidebarVia: '#fff3df',
      adminSidebarTo: '#f6e7bf',
      heroGradientFrom: 'rgba(187, 135, 50, 0.82)',
      heroGradientVia: 'rgba(232, 185, 85, 0.54)',
      heroGradientTo: 'rgba(255, 255, 255, 0.08)',
    },
  },
  {
    key: 'kiki-signature',
    name: 'Kiki Signature',
    colors: {
      primary50: '#eefafd',
      primary100: '#d7f2f8',
      primary200: '#afe3f0',
      primary300: '#7fd1e2',
      primary400: '#4eb7cf',
      primary500: '#2f9cb6',
      primary600: '#247f98',
      primary700: '#1f667a',
      primary800: '#204f5f',
      primary900: '#1f434f',
      accent: '#d4a63f',
      accentSoft: '#f6e7bf',
      adminSidebarFrom: '#fbe4ec',
      adminSidebarVia: '#e2f7fb',
      adminSidebarTo: '#e4e6fb',
      heroGradientFrom: 'rgba(235, 156, 186, 0.72)',
      heroGradientVia: 'rgba(36, 127, 152, 0.58)',
      heroGradientTo: 'rgba(138, 150, 227, 0.18)',
    },
  },
];

const defaultTheme = themePresets.find((theme) => theme.key === 'kiki-signature') || themePresets[0];

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
