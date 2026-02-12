import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize auth state synchronously from localStorage to prevent flicker
  // Using lazy initialization ensures this only runs once on mount
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('userData');
  });

  const [isLoading, setIsLoading] = useState(false);

  // Listen for storage changes (in case user logs in/out in another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('userData'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (userData) => {
    localStorage.setItem('userData', JSON.stringify(userData));
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
