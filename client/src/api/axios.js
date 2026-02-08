// client/src/api/axios.js
/**
 * Axios HTTP Client Configuration
 * Centralized API communication with interceptors for auth and error handling
 */

import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api',
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // ✅ important for cookies and CORS
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log('🌐 API Request:', config.method.toUpperCase(), config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', response.config.url, response.status);
    }
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token');
          console.warn('🔒 Unauthorized - Token may be expired');
          break;
          
        case 403:
          console.error('🚫 Forbidden - Insufficient permissions');
          break;
          
        case 404:
          console.error('🔍 Not Found:', error.config.url);
          break;
          
        case 500:
          console.error('💥 Server Error:', data.error || 'Internal server error');
          break;
          
        default:
          console.error('❌ API Error:', status, data);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('📡 Network Error - No response from server');
      error.code = 'ERR_NETWORK';
    } else {
      // Error setting up request
      console.error('⚙️ Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions for common operations

/**
 * Store authentication token
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

/**
 * Get stored authentication token
 */
export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Clear authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('auth_token');
  sessionStorage.clear();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

export default api;