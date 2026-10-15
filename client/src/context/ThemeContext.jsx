import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('hunarhub_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {}
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const isDark = theme === 'dark';

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.setAttribute('data-bs-theme', 'dark');
      root.style.colorScheme = 'dark';
      if (body) {
        body.classList.add('dark');
        body.setAttribute('data-theme', 'dark');
        body.setAttribute('data-bs-theme', 'dark');
        body.style.colorScheme = 'dark';
      }
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.setAttribute('data-bs-theme', 'light');
      root.style.colorScheme = 'light';
      if (body) {
        body.classList.remove('dark');
        body.setAttribute('data-theme', 'light');
        body.setAttribute('data-bs-theme', 'light');
        body.style.colorScheme = 'light';
      }
    }

    try {
      localStorage.setItem('hunarhub_theme', theme);
    } catch (e) {}

    // Dispatch custom event for any listeners
    window.dispatchEvent(new CustomEvent('hunarhub_theme_change', { detail: { theme } }));
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
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
