import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects to sign-in page if user is not authenticated
 * 
 * OPTIMIZED: Uses AuthContext to prevent re-checks and eliminate flicker
 * No loading state needed since auth is checked synchronously from localStorage
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Use cached auth state - no delay, no flicker
  // Since we initialize from localStorage synchronously, this is instant
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;
