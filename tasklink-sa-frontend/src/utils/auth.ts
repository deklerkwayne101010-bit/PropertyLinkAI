import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

// JWT token validation utility
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    // If token is malformed, consider it expired
    return true;
  }
};

// Check if user is authenticated and token is valid
export const checkAuthStatus = (): boolean => {
  const state = store.getState();
  const { token, isAuthenticated } = state.auth;

  if (!isAuthenticated || !token) {
    return false;
  }

  // Check if token is expired
  if (isTokenExpired(token)) {
    // Auto logout if token is expired
    store.dispatch(logout());
    return false;
  }

  return true;
};

// Get stored token from localStorage (if needed for persistence)
export const getStoredToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Store token in localStorage
export const storeToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Remove token from localStorage
export const removeStoredToken = (): void => {
  localStorage.removeItem('authToken');
};

// Initialize auth state from localStorage on app startup
export const initializeAuth = (): void => {
  const token = getStoredToken();
  if (token && !isTokenExpired(token)) {
    // Token exists and is valid - you might want to validate with server
    // For now, we'll trust the local token
    // In a production app, you might want to call an API to refresh/validate
  } else if (token && isTokenExpired(token)) {
    // Token exists but is expired - clean up
    removeStoredToken();
  }
};

// Start periodic token expiration check
export const startTokenExpirationCheck = (store: any): (() => void) => {
  const checkInterval = setInterval(() => {
    const state = store.getState();
    const { token, isAuthenticated } = state.auth;

    if (isAuthenticated && token && isTokenExpired(token)) {
      // Token has expired, logout automatically
      store.dispatch({ type: 'auth/logout' });
    }
  }, 60000); // Check every minute

  // Return cleanup function
  return () => clearInterval(checkInterval);
};