import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState } from '../../store/store';
import { CircularProgress, Box } from '@mui/material';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, initialized } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // Show loading spinner while initializing or checking authentication
  if (!initialized || loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // If authenticated, redirect to dashboard or the intended location
  if (isAuthenticated) {
    // Check if there's a redirect location from a private route
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  // If not authenticated, render the public component (login/register pages)
  return <>{children}</>;
};

export default PublicRoute;