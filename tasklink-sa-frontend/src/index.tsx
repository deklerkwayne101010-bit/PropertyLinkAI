import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useDispatch } from 'react-redux';
import { CircularProgress, Box } from '@mui/material';
import App from './App';
import { store } from './store/store';
import { initializeAuth } from './store/slices/authSlice';
import { getStoredToken, isTokenExpired, startTokenExpirationCheck } from './utils/auth';

// Auth initializer component
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    const initializeAuthState = async () => {
      try {
        const token = getStoredToken();

        if (token && !isTokenExpired(token)) {
          // For now, we'll initialize with basic user info from token
          // In a production app, you might want to validate with the server
          const payload = JSON.parse(atob(token.split('.')[1]));
          const user = {
            id: payload.userId || payload.sub,
            email: payload.email,
            name: payload.name || payload.email,
            role: payload.role || 'task_doer'
          };

          dispatch(initializeAuth({ user, token }));
        } else {
          // No valid token found
          dispatch(initializeAuth(null));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch(initializeAuth(null));
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuthState();

    // Start periodic token expiration check
    const stopTokenCheck = startTokenExpirationCheck(store);

    // Cleanup function
    return () => {
      stopTokenCheck();
    };
  }, [dispatch]);

  if (isInitializing) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ backgroundColor: '#f5f5f5' }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return <>{children}</>;
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <Provider store={store}>
    <AuthInitializer>
      <App />
    </AuthInitializer>
  </Provider>
);