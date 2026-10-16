import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('hunarhub_theme');
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    } catch (e) {}
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    try {
      return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (e) {
      return false;
    }
  });

  // Listen to OS system theme changes live
  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemPrefersDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.setAttribute('data-bs-theme', 'dark');
      root.style.colorScheme = 'dark';
      root.style.backgroundColor = '#020617';
      if (body) {
        body.classList.add('dark');
        body.setAttribute('data-theme', 'dark');
        body.setAttribute('data-bs-theme', 'dark');
        body.style.colorScheme = 'dark';
        body.style.backgroundColor = '#020617';
      }
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.setAttribute('data-bs-theme', 'light');
      root.style.colorScheme = 'light';
      root.style.backgroundColor = '#faf8f5';
      if (body) {
        body.classList.remove('dark');
        body.setAttribute('data-theme', 'light');
        body.setAttribute('data-bs-theme', 'light');
        body.style.colorScheme = 'light';
        body.style.backgroundColor = '#faf8f5';
      }
    }

    try {
      localStorage.setItem('hunarhub_theme', theme);
    } catch (e) {}

    // Dispatch custom event for cross-component sync
    window.dispatchEvent(new CustomEvent('hunarhub_theme_change', { detail: { theme, isDark } }));
  }, [theme, isDark]);

  const toggleTheme = () => {
    // If currently dark (either explicit or system), switch to light. Otherwise switch to dark.
    setTheme(isDark ? 'light' : 'dark');
  };

  const setSystemTheme = () => {
    setTheme('system');
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme, setSystemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
