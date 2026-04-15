import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/api.js';

const defaultColors = {
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
};

const THEME_CACHE_KEY = 'kiki_active_theme';
const fallbackTheme = { themeKey: 'kiki-classic', themeName: 'Kiki Classic', colors: defaultColors };

const ThemeContext = createContext({
  theme: fallbackTheme,
  refreshTheme: async () => {},
});

const readCachedTheme = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = window.localStorage.getItem(THEME_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (!parsed?.themeKey || !parsed?.colors) return null;
    if (parsed.themeKey === 'kiki-signature') return null;
    return parsed;
  } catch {
    return null;
  }
};

const cacheTheme = (nextTheme) => {
  if (typeof window === 'undefined' || !nextTheme?.themeKey) return;
  try {
    window.localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(nextTheme));
  } catch {
    // Theme caching is only used to avoid refresh flashes; API theme still works.
  }
};

const hexToRgb = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized.startsWith('#')) return null;

  let hex = normalized.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map((char) => `${char}${char}`).join('');
  }
  if (hex.length !== 6) return null;

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  if ([red, green, blue].some((channel) => Number.isNaN(channel))) return null;
  return `${red}, ${green}, ${blue}`;
};

const applyThemeVariables = (colors) => {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);

    const rgbValue = hexToRgb(value);
    if (!rgbValue) return;

    root.style.setProperty(`--theme-${key}-rgb`, rgbValue);
    [4, 8, 12, 16, 24, 32, 48, 64, 80].forEach((alpha) => {
      root.style.setProperty(`--theme-${key}-rgba-${alpha}`, `rgba(${rgbValue}, ${alpha / 100})`);
    });
  });
};

const applyThemeKey = (themeKey) => {
  const root = document.documentElement;
  if (themeKey) {
    root.setAttribute('data-theme-key', themeKey);
  } else {
    root.removeAttribute('data-theme-key');
  }
};

export function ThemeProvider({ children }) {
  const [initialTheme] = useState(readCachedTheme);
  const [theme, setTheme] = useState(() => initialTheme || fallbackTheme);
  const [themeReady, setThemeReady] = useState(() => Boolean(initialTheme));

  const refreshTheme = async () => {
    const response = await api.get('/theme-settings');
    const nextTheme = response.data.data?.activeTheme || theme;
    setTheme(nextTheme);
    applyThemeKey(nextTheme.themeKey);
    applyThemeVariables(nextTheme.colors || defaultColors);
    cacheTheme(nextTheme);
    setThemeReady(true);
    return response.data.data;
  };

  useEffect(() => {
    applyThemeKey(theme.themeKey);
    applyThemeVariables(theme.colors || defaultColors);
    refreshTheme().catch(() => {
      setThemeReady(true);
    });
  }, []);

  useEffect(() => {
    applyThemeKey(theme.themeKey);
    applyThemeVariables(theme.colors || defaultColors);
  }, [theme]);

  const value = useMemo(() => ({ theme, refreshTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{themeReady ? children : null}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
