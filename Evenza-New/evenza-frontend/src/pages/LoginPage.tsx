import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axios from 'axios';
import { 
  Alert, Button, TextField, Typography, 
  Paper, Box, Container, Divider
} from '@mui/material';
import { LogIn, Github } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../config/firebase';

// Import directly from your service
import { firebaseLogin } from '../services/authService';
// Import the redirect utility
import { redirectAfterLogin } from '../utils/authRedirect';

// Hardcoded admin credentials
const ADMIN_EMAIL = "admin1@gmail.com";
const ADMIN_PASSWORD = "admin1@123";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, message, clearMessage, isAuthenticated, user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [localMessage, setLocalMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    // Get navigation state to check if we're coming from registration or profile
    const isFromRegistration = location.state?.from === 'registration';
    const isFromProfile = location.state?.from === './pages/HomePage';
    
    // Check if we have both JWT token AND Firebase user
    const hasToken = !!localStorage.getItem('token');
    const hasFirebaseUser = !!auth.currentUser;
    
    // Only auto-redirect if authenticated by our backend (JWT) 
    // AND either Firebase user exists OR we're not coming from profile page
    // AND not coming from registration
    if (isAuthenticated && hasToken && (hasFirebaseUser || !isFromProfile) && !isFromRegistration) {
      console.log("User already authenticated, redirecting based on role");
      // Get the from path if it exists
      const fromPath = location.state?.from || null;
      redirectAfterLogin(user?.role, navigate, fromPath);
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdminLogin = async () => {
    console.log("Admin login - Using backend API for authentication");
    
    try {
      // Call the real backend API with admin credentials
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });

      if (response.data.status === 'success') {
        console.log("Admin login successful via backend API");
        
        // Extract user data from response
        const adminUserData = {
          id: response.data.id,
          name: response.data.name || "Admin User",
          email: ADMIN_EMAIL,
          role: response.data.role || "ADMIN"
        };

        // Store real tokens from backend
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(adminUserData));
        
        // Set auth headers with the real token
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        setLocalMessage({
          type: 'success',
          text: 'Admin login successful! Redirecting...'
        });
        
        setTimeout(() => {
          // Redirect to admin dashboard
          navigate('/admin');
        }, 1500);
      } else {
        throw new Error("Backend authentication failed");
      }
    } catch (error) {
      console.error("Admin login via backend failed:", error);
      
      // Fallback to the local token approach if backend call fails
      console.warn("Falling back to local token generation for admin");
      
      // Create admin user data
      const adminUserData = {
        id: "admin-user",
        name: "Admin User",
        email: ADMIN_EMAIL,
        role: "ADMIN"
      };
      
      // Create a proper JWT-format token manually as fallback
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({
        sub: ADMIN_EMAIL,
        userId: 999,
        role: "ADMIN",
        name: "Admin User",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }));
      const signature = btoa("mock-signature-for-admin-only");
      
      // Combine to create JWT format
      const jwtToken = `${header}.${payload}.${signature}`;
      
      // Save to localStorage
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('refreshToken', jwtToken);
      localStorage.setItem('user', JSON.stringify(adminUserData));
      
      // Set auth headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      
      setLocalMessage({
        type: 'success',
        text: 'Admin login successful (fallback mode)! Redirecting...'
      });
      
      setTimeout(() => {
        // Redirect to admin dashboard
        navigate('/admin');
      }, 1500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalMessage(null);
    
    // Check for hardcoded admin credentials and use backend auth flow
    if (formData.email === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD) {
      await handleAdminLogin();
      setLoading(false);
      return;
    }
    
    // Clear any existing auth session first if not admin login
    await logout();
    
    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Redirect after short delay to show success message
        setLocalMessage({
          type: 'success',
          text: 'Login successful! Redirecting...'
        });
        
        // Get target path from location state
        const targetPath = location.state?.from || '/home';
        
        setTimeout(() => {
          // Get the stored user data to access role
          const storedUser = localStorage.getItem('user');
          const userData = storedUser ? JSON.parse(storedUser) : null;
          
          // Use role-based redirect with proper role
          console.log("Redirecting after login with role:", userData?.role);
          redirectAfterLogin(userData?.role, navigate, targetPath);
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setLocalMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(true);
    setLocalMessage(null);
    
    // Clear any existing auth session first
    await logout();
    
    try {
      const authProvider = provider === 'google' ? googleProvider : githubProvider;
      
      // Configure provider for better compatibility
      if (provider === 'google') {
        googleProvider.setCustomParameters({
          prompt: 'select_account'
        });
      }
      
      console.log(`Attempting ${provider} login...`);
      const result = await signInWithPopup(auth, authProvider);
      
      // Get the Firebase ID token
      const idToken = await result.user.getIdToken(true); // Force refresh
      console.log(`${provider} login successful, got token (length: ${idToken.length})`);
      
      // Send the token to your backend
      const response = await firebaseLogin(idToken);
      
      if (response && response.token) {
        setLocalMessage({
          type: 'success',
          text: `${provider.charAt(0).toUpperCase() + provider.slice(1)} login successful! Redirecting...`
        });
        
        // Get target path from location state
        const targetPath = location.state?.from || null;
        
        // Add a small delay before redirecting
        setTimeout(() => {
          // Use role-based redirect with target path
          redirectAfterLogin(response.user?.role, navigate, targetPath);
        }, 1500);
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
      
      // Handle Firebase specific errors
      let errorMessage = `${provider} login failed. Please try again.`;
      
      if (error instanceof Error) {
        if ('code' in error && error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login canceled. You closed the login window.';
        } else if ('code' in error && error.code === 'auth/popup-blocked') {
        errorMessage = 'Login popup was blocked. Please allow popups for this site.';
      } else if (error.message) {
        errorMessage = error.message;
        }
      }
      
      setLocalMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Display either context message or local message
  const displayMessage = message || localMessage;

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Login
          </Typography>
          
          {displayMessage && (
            <Alert 
              severity={displayMessage.type} 
              sx={{ mb: 2 }}
              onClose={() => {
                clearMessage();
                setLocalMessage(null);
              }}
            >
              {displayMessage.text}
            </Alert>
          )}
          
          {/* Social Login Buttons */}
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LogIn />}
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              sx={{ 
                mb: 2, 
                borderColor: '#4285F4', 
                color: '#4285F4',
                '&:hover': { borderColor: '#4285F4', backgroundColor: 'rgba(66, 133, 244, 0.04)' }
              }}
            >
              Continue with Google
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Github />}
              onClick={() => handleSocialLogin('github')}
              disabled={loading}
              sx={{ 
                borderColor: '#24292e', 
                color: '#24292e',
                '&:hover': { borderColor: '#24292e', backgroundColor: 'rgba(36, 41, 46, 0.04)' }
              }}
            >
              Continue with GitHub
            </Button>
          </Box>
          
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>
          
          {/* Email/Password Login Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate('/forgot-password');
                  }}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link to="/register">Register here</Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
