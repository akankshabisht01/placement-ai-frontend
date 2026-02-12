// API Configuration
// Uses environment variable in production, falls back to localhost for development

export const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Helper function to build API URLs
export const apiUrl = (path) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export default API_BASE_URL;
