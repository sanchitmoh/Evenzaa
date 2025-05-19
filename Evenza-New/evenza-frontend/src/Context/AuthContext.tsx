import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { firebaseLogin } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { isTokenValid, setupAxiosInterceptors } from '../utils/authUtils';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  message: { type: 'success' | 'error', text: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  socialLogin: (idToken: string) => Promise<boolean>;
  logout: () => void;
  clearMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProviderWithRouter: React.FC<{ children: ReactNode }> = ({ children }) => {
 
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const logout = () => {
    localStorage.setItem('_ignoreAuthChanges', 'true');
    
    // Clear all tokens and user data
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Clear auth headers
    delete axios.defaults.headers.common['Authorization'];
    
    setUser(null);
    setIsAuthenticated(false);
    
    // Only sign out of Firebase if we were using Firebase auth
    const storedUser = localStorage.getItem('user');
    const userData = storedUser ? JSON.parse(storedUser) : null;
    
    if (!userData || userData.email !== 'admin1@gmail.com') {
      signOut(auth).catch(error => console.error("Firebase sign out error:", error));
    }
    
    setMessage({ type: 'success', text: 'Logged out successfully' });
    
    setTimeout(() => {
      localStorage.removeItem('_ignoreAuthChanges');
    }, 1000);
  };

  useEffect(() => {
    let ignoreAuthChanges = false;
    
    const checkAuth = async () => {
      setLoading(true);
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);

          // Check if this is an admin user by role instead of token prefix
          if (userData.role === 'ADMIN' && userData.email === 'admin1@gmail.com') {
            console.log("Admin user detected, setting admin authentication");
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            setUser(userData);
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }

          if (isTokenValid(storedToken)) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              try {
                const response = await axios.post('http://localhost:8080/api/auth/refresh',
                  { refreshToken },
                  { withCredentials: true }
                );

                if (response.data.accessToken) {
                  localStorage.setItem('token', response.data.accessToken);
                  axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
                  setUser(userData);
                  setIsAuthenticated(true);
                } else {
                  ignoreAuthChanges = true;
                  logout();
                }
              } catch (err) {
                console.error('Token refresh failed:', err);
                ignoreAuthChanges = true;
                logout();
              }
            } else {
              const currentFirebaseUser = auth.currentUser;
              if (!currentFirebaseUser) {
                ignoreAuthChanges = true;
                logout();
              }
            }
          }
        } else {
          const currentFirebaseUser = auth.currentUser;
          if (!currentFirebaseUser) {
            ignoreAuthChanges = true;
            logout();
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    setupAxiosInterceptors(() => navigate('/login'));

    let isProcessingFirebaseLogin = false;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Firebase user detected:", firebaseUser);
      
      if (ignoreAuthChanges) {
        ignoreAuthChanges = false;
        return;
      }
      
      if (firebaseUser && !isProcessingFirebaseLogin) {
        try {
          isProcessingFirebaseLogin = true;
          
          const storedToken = localStorage.getItem('token');
          const isLoggedIn = !!user && isAuthenticated;
          
          if ((!storedToken || !isTokenValid(storedToken)) && !isLoggedIn) {
            console.log("Getting new ID token for Firebase user");
            const idToken = await firebaseUser.getIdToken(true);
            await socialLogin(idToken);
          } else {
            console.log("Already authenticated with valid token");
            if (storedToken) {
              axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
          }
        } catch (error) {
          console.error("Firebase auth state change error:", error);
        } finally {
          isProcessingFirebaseLogin = false;
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', { email, password });

      if (response.data.status === 'success') {
        const userData = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role || 'USER'
        };

        console.log('Login successful. User data:', {
          id: response.data.id,
          name: response.data.name,
          role: userData.role
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUser(userData);
        setIsAuthenticated(true);
        setMessage({ type: 'success', text: response.data.message || 'Login successful!' });

        return true;
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
                          'Login failed. Please check your credentials.';
      setMessage({ type: 'error', text: errorMessage });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (idToken: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await firebaseLogin(idToken);

      if (response && response.token) {
        const userData = {
          id: response.user.id || response.user.uid || '',
          name: response.user.name || '',
          email: response.user.email || '',
          role: response.user.role || 'USER'
        };

        console.log('Social login successful. User data:', {
          id: userData.id,
          name: userData.name,
          role: userData.role
        });

        localStorage.setItem('token', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(userData));

        axios.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
        setUser(userData);
        setIsAuthenticated(true);
        setMessage({ type: 'success', text: 'Social login successful!' });

        return true;
      } else {
        console.error('Invalid response from social login:', response);
        setMessage({ type: 'error', text: response.message || 'Social login failed' });
        return false;
      }
    } catch (error: unknown) {
      console.error('Social login error:', error);
      const errorMessage = error instanceof Error ? error.message : 
                          'Social login failed. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', { name, email, password });

      if (response.data.status === 'success') {
        setMessage({ type: 'success', text: response.data.message || 'Registration successful!' });
        return true;
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
                          'Registration failed. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => setMessage(null);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      message,
      login,
      register,
      socialLogin,
      logout,
      clearMessage
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <AuthProviderWithRouter>{children}</AuthProviderWithRouter>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
