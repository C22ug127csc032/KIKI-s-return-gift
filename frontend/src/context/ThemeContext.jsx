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

const ThemeContext = createContext({
  theme: { themeKey: 'kiki-classic', themeName: 'Kiki Classic', colors: defaultColors },
  refreshTheme: async () => {},
});

const applyThemeVariables = (colors) => {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState({
    themeKey: 'kiki-classic',
    themeName: 'Kiki Classic',
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
