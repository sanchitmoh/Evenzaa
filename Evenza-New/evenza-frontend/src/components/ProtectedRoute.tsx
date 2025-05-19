import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { isTokenValid, removeTokens, getUserRoleFromToken } from '../utils/authUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);
  const location = useLocation();
  
  // Use refs to track states to prevent infinite loops
  const logoutTriggered = useRef(false);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Token validation on mount - with protection against infinite loops
  useEffect(() => {
    // Skip if loading or already triggered logout
    if (isLoading || logoutTriggered.current) {
      return;
    }
    
    // Skip token validation if already done initial check
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      
      try {
        // Check token validity
        const tokenValid = isTokenValid();
        if (!tokenValid) {
          console.log("Token validation failed, logging out");
          logoutTriggered.current = true;
          removeTokens();
          logout(); // clear context state
          return;
        }
      } catch (error) {
        console.error("Error in ProtectedRoute validation:", error);
        logoutTriggered.current = true;
        removeTokens();
        logout();
        return;
      }
    }

    // Get user role directly from token if needed
    const userRole = user?.role || getUserRoleFromToken();
    
    // Check if path contains admin and user is not an admin
    if (location.pathname.includes('/admin') && userRole !== 'ADMIN') {
      console.log("Non-admin user attempting to access admin route, redirecting");
      logoutTriggered.current = true;
      logout();
    }
  }, [isLoading, logout, location.pathname, user?.role]);

  // Reset the ref when authentication state changes
  useEffect(() => {
    logoutTriggered.current = false;
  }, [isAuthenticated]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Get user role directly from token if needed
  const userRole = user?.role || getUserRoleFromToken();
  
  // If role is required and user doesn't have it, redirect to unauthorized
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and has required role, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
