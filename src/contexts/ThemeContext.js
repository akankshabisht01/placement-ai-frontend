import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check local storage or default to system
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'system';
  });

  // Track the actual active theme (resolved from system preference if needed)
  const [activeTheme, setActiveTheme] = useState(theme);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove('dark', 'midnight', 'aloof', 'aurora', 'solaris');

    let resolvedTheme = theme;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'midnight') {
      root.classList.add('dark', 'midnight');
    } else if (theme === 'aloof') {
      root.classList.add('aloof');
    } else if (theme === 'aurora') {
      root.classList.add('aurora');
    } else if (theme === 'solaris') {
      root.classList.add('solaris');
    } else if (theme === 'system') {
      // Check system preference and apply daylight or midnight theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        // Use midnight theme for dark mode
        root.classList.add('dark', 'midnight');
        resolvedTheme = 'midnight';
      } else {
        // Use daylight (light) theme for light mode
        resolvedTheme = 'light';
      }
    }
    // If theme is 'light', dark class is already removed
    
    setActiveTheme(resolvedTheme);
    // Save resolved theme to localStorage (not 'system')
    localStorage.setItem('theme', resolvedTheme);
  }, [theme]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const root = document.documentElement;
      root.classList.remove('dark', 'midnight');
      if (e.matches) {
        // Use midnight theme for dark mode
        root.classList.add('dark', 'midnight');
        setActiveTheme('midnight');
      } else {
        // Use daylight (light) theme for light mode
        setActiveTheme('light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'midnight';
      if (prevTheme === 'midnight') return 'aloof';
      if (prevTheme === 'aloof') return 'aurora';
      if (prevTheme === 'aurora') return 'solaris';
      return 'light'; // solaris -> light
    });
  };

  const setThemeMode = (mode) => {
    if (['light', 'dark', 'midnight', 'aloof', 'aurora', 'solaris'].includes(mode)) {
      setTheme(mode);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
