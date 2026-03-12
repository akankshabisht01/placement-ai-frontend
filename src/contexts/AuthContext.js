import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  const logout = useCallback(() => {
    localStorage.removeItem('userData');
    localStorage.removeItem('sessionVersion');
    localStorage.removeItem('sessionToken');
    setIsAuthenticated(false);
  }, []);

  // Verify session on mount and periodically
  const verifySession = useCallback(async () => {
    try {
      const userData = localStorage.getItem('userData');
      const sessionVersion = localStorage.getItem('sessionVersion');
      const sessionToken = localStorage.getItem('sessionToken');
      
      if (!userData) return;
      
      const user = JSON.parse(userData);
      if (!user.email) return;
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/verify-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          sessionVersion: parseInt(sessionVersion || '0', 10),
          sessionToken: sessionToken || ''
        })
      });
      
      const data = await response.json();
      
      if (!data.valid) {
        // Session has been invalidated (logged in on another device or password changed)
        console.log('Session invalidated - logging out');
        alert(data.message || 'Your session has expired. Please log in again.');
        logout();
      }
    } catch (error) {
      // Network error - don't logout, just log the error
      console.log('Session verification failed:', error);
    }
  }, [logout]);

  // Listen for storage changes (in case user logs in/out in another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('userData'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Verify session on mount and set up periodic check
  useEffect(() => {
    if (isAuthenticated) {
      verifySession();
      
      // Check session every 5 minutes
      const interval = setInterval(verifySession, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, verifySession]);

  const login = (userData, sessionVersion = 0, sessionToken = '') => {
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('sessionVersion', String(sessionVersion));
    if (sessionToken) {
      localStorage.setItem('sessionToken', sessionToken);
    }
    setIsAuthenticated(true);
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    verifySession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
