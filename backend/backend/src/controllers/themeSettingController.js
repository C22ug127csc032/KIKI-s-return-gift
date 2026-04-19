import ThemeSetting from '../models/ThemeSetting.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hexToRgb = (hex) => {
  const normalized = String(hex || '').trim();
  if (!/^#([A-Fa-f0-9]{6})$/.test(normalized)) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
};

const rgbToHex = ({ r, g, b }) => `#${[r, g, b].map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0')).join('')}`;

const rgbToHsl = ({ r, g, b }) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h;
  let s;
  const l = (max + min) / 2;

  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case red:
        h = ((green - blue) / delta) + (green < blue ? 6 : 0);
        break;
      case green:
        h = ((blue - red) / delta) + 2;
        break;
      default:
        h = ((red - green) / delta) + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  };
};

const hslToRgb = ({ h, s, l }) => {
  const hue = (((h % 360) + 360) % 360) / 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;

  if (saturation === 0) {
    const channel = Math.round(lightness * 255);
    return { r: channel, g: channel, b: channel };
  }

  const hueToChannel = (p, q, t) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    r: Math.round(hueToChannel(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToChannel(p, q, hue) * 255),
    b: Math.round(hueToChannel(p, q, hue - 1 / 3) * 255),
  };
};

const adjustColor = (hex, { hueShift = 0, saturationDelta = 0, lightnessDelta = 0 } = {}) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb);
  return rgbToHex(hslToRgb({
    h: hsl.h + hueShift,
    s: clamp(hsl.s + saturationDelta, 8, 95),
    l: clamp(hsl.l + lightnessDelta, 4, 98),
  }));
};

const buildRgbString = (hex) => {
  const rgb = hexToRgb(hex);
  return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '0, 0, 0';
};

const buildHeroGradientStop = (hex, alpha) => `rgba(${buildRgbString(hex)}, ${alpha})`;

const buildCustomThemeColors = (primaryHex, accentHex) => ({
  primary50: adjustColor(primaryHex, { saturationDelta: -24, lightnessDelta: 42 }),
  primary100: adjustColor(primaryHex, { saturationDelta: -18, lightnessDelta: 34 }),
  primary200: adjustColor(primaryHex, { saturationDelta: -10, lightnessDelta: 24 }),
  primary300: adjustColor(primaryHex, { saturationDelta: -4, lightnessDelta: 14 }),
  primary400: adjustColor(primaryHex, { lightnessDelta: 7 }),
  primary500: adjustColor(primaryHex, { lightnessDelta: 2 }),
  primary600: primaryHex,
  primary700: adjustColor(primaryHex, { saturationDelta: 4, lightnessDelta: -10 }),
  primary800: adjustColor(primaryHex, { saturationDelta: 6, lightnessDelta: -18 }),
  primary900: adjustColor(primaryHex, { saturationDelta: 4, lightnessDelta: -28 }),
  accent: accentHex,
  accentSoft: adjustColor(accentHex, { saturationDelta: -20, lightnessDelta: 32 }),
  adminSidebarFrom: adjustColor(primaryHex, { saturationDelta: -26, lightnessDelta: 42 }),
  adminSidebarVia: adjustColor(primaryHex, { saturationDelta: -20, lightnessDelta: 36, hueShift: -4 }),
  adminSidebarTo: adjustColor(accentHex, { saturationDelta: -18, lightnessDelta: 28 }),
  heroGradientFrom: buildHeroGradientStop(adjustColor(primaryHex, { lightnessDelta: -18 }), 0.82),
  heroGradientVia: buildHeroGradientStop(primaryHex, 0.58),
  heroGradientTo: 'rgba(255, 255, 255, 0)',
});

const isValidHexColor = (value) => /^#([A-Fa-f0-9]{6})$/.test(String(value || '').trim());

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
  const useCustomColors = Boolean(themeSetting.useCustomColors);
  const customPrimaryHex = isValidHexColor(themeSetting.customPrimaryHex) ? themeSetting.customPrimaryHex : defaultTheme.colors.primary600;
  const customAccentHex = isValidHexColor(themeSetting.customAccentHex) ? themeSetting.customAccentHex : defaultTheme.colors.accent;
  const resolvedThemeName = useCustomColors ? 'Kiki Custom' : selectedTheme.name;
  const resolvedColors = useCustomColors
    ? buildCustomThemeColors(customPrimaryHex, customAccentHex)
    : selectedTheme.colors;
  const serializedStoredColors = JSON.stringify(themeSetting.colors || {});
  const serializedResolvedColors = JSON.stringify(resolvedColors);

  if (
    themeSetting.themeKey !== selectedTheme.key ||
    themeSetting.themeName !== resolvedThemeName ||
    serializedStoredColors !== serializedResolvedColors
  ) {
    themeSetting.themeKey = selectedTheme.key;
    themeSetting.themeName = resolvedThemeName;
    themeSetting.colors = resolvedColors;
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
  const { themeKey, useCustomColors, primaryColor, accentColor } = req.body;

  const selectedTheme = themePresets.find((theme) => theme.key === themeKey);

  if (!selectedTheme) {
    throw new ApiError(400, 'Selected theme is invalid');
  }

  const themeSetting = await ensureThemeSetting();
  themeSetting.themeKey = selectedTheme.key;
  themeSetting.useCustomColors = useCustomColors === true || useCustomColors === 'true';

  if (themeSetting.useCustomColors) {
    if (!isValidHexColor(primaryColor) || !isValidHexColor(accentColor)) {
      throw new ApiError(400, 'Valid custom colors are required');
    }

    const primaryRgb = hexToRgb(primaryColor);
    const accentRgb = hexToRgb(accentColor);

    themeSetting.themeName = 'Kiki Custom';
    themeSetting.customPrimaryHex = primaryColor;
    themeSetting.customAccentHex = accentColor;
    themeSetting.customPrimaryRgb = primaryRgb;
    themeSetting.customAccentRgb = accentRgb;
    themeSetting.colors = buildCustomThemeColors(primaryColor, accentColor);
  } else {
    themeSetting.themeName = selectedTheme.name;
    themeSetting.colors = selectedTheme.colors;
  }

  await themeSetting.save();

  sendResponse(res, 200, 'Theme updated', {
    activeTheme: themeSetting,
    presets: themePresets,
  });
});
