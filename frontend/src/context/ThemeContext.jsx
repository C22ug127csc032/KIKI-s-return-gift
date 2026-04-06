import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/api.js';

const defaultColors = {
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
};

const ThemeContext = createContext({
  theme: { themeKey: 'kiki-signature', themeName: 'Kiki Signature', colors: defaultColors },
  refreshTheme: async () => {},
});

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

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState({
    themeKey: 'kiki-signature',
    themeName: 'Kiki Signature',
    colors: defaultColors,
  });

  const refreshTheme = async () => {
    const response = await api.get('/theme-settings');
    const nextTheme = response.data.data?.activeTheme || theme;
    setTheme(nextTheme);
    applyThemeVariables(nextTheme.colors || defaultColors);
    return response.data.data;
  };

  useEffect(() => {
    applyThemeVariables(defaultColors);
    refreshTheme().catch(() => {
      applyThemeVariables(defaultColors);
    });
  }, []);

  useEffect(() => {
    applyThemeVariables(theme.colors || defaultColors);
  }, [theme]);

  const value = useMemo(() => ({ theme, refreshTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
