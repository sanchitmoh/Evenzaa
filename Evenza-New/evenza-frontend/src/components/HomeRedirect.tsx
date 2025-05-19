import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { redirectAfterLogin } from '../utils/authRedirect';

const HomeRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  
  useEffect(() => {
    // If still loading auth state, wait
    if (loading) return;
    
    // Prevent multiple redirects
    if (redirectAttempted) return;
    setRedirectAttempted(true);
    
    // Handle redirect logic
    try {
      if (isAuthenticated && user) {
        // If authenticated, redirect based on role
        console.log("Redirecting authenticated user based on role:", user.role);
        // Get the from path if it exists
        const fromPath = location.state?.from || null;
        redirectAfterLogin(user.role, navigate, fromPath);
      } else {
        // If not authenticated, just show the home page
        console.log("Redirecting unauthenticated user to home page");
        navigate('/home');
      }
    } catch (error) {
      console.error("Error during home redirect:", error);
      // If any error occurs, safely redirect to home
      navigate('/home');
    }
  }, [user, isAuthenticated, loading, navigate, redirectAttempted, location]);
  
  // Display loading state
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
};

export default HomeRedirect; 