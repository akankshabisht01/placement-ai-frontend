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

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove('dark', 'midnight', 'aloof', 'aurora', 'solaris');

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
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      }
    }
    // If theme is 'light', dark class is already removed
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
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
      if (prevTheme === 'solaris') return 'system';
      return 'light'; // system -> light
    });
  };

  const setThemeMode = (mode) => {
    if (['light', 'dark', 'midnight', 'aloof', 'aurora', 'solaris', 'system'].includes(mode)) {
      setTheme(mode);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
