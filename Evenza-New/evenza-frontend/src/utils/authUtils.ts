import axios, { AxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';

const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_REFRESH_BUFFER = 60 * 1000; // 1 minute buffer for token refresh

interface DecodedToken {
  sub: string; // email
  userId: number;
  role: string;
  exp: number;
  iat: number;
  email: string;
}

interface CustomAxiosRequest extends AxiosRequestConfig {
  _retry?: boolean;
}

// Store token and set axios default header
export const storeTokenAndSetAxiosHeader = (token: string, refreshToken?: string): boolean => {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token');
    }

    // Validate token format
    const decoded = jwtDecode(token);
    if (!decoded) {
      throw new Error('Invalid token format');
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    // Set token in axios default headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return true;
  } catch (error) {
    console.error('Error storing token:', error);
    removeTokens();
    return false;
  }
};

// Remove tokens and axios auth header
export const removeTokens = (): boolean => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    delete axios.defaults.headers.common['Authorization'];
    return true;
  } catch (error) {
    console.error('Error removing tokens:', error);
    return false;
  }
};

// Get tokens
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

// Set or remove axios auth header
export const setAuthHeader = (token: string) => {
  if (!token) {
    delete axios.defaults.headers.common['Authorization'];
    return;
  }
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const removeAuthHeader = () => {
  delete axios.defaults.headers.common['Authorization'];
};

// Token validation with refresh attempt
export const isTokenValid = async (tokenParam?: string): Promise<boolean> => {
  try {
    const token = tokenParam || getToken();
    if (!token) {
      console.log("No token found");
      return false;
    }

    // Basic check for JWT format
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.log("Invalid token format");
      if (!tokenParam) {
        removeTokens();
      }
      return false;
    }

    const decoded = jwtDecode<DecodedToken>(token);
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    // Check if token is expired
    if (currentTime >= expirationTime) {
      console.log("Token has expired");
      if (!tokenParam) {
        removeTokens();
      }
      return false;
    }

    // Check if token is expiring soon
    if (currentTime >= (expirationTime - TOKEN_REFRESH_BUFFER)) {
      console.log("Token is expiring soon");
      return false;
    }

    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    if (!tokenParam) {
      removeTokens();
    }
    return false;
  }
};

// Decode token
export const getDecodedToken = (): DecodedToken | null => {
  try {
    const token = getToken();
    if (!token) return null;

    if (!token.includes('.') || token.split('.').length !== 3) {
      console.log("Invalid token format in getDecodedToken");
      return null;
    }

    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
};

// User info helpers
export const getUserIdFromToken = (): number | null => getDecodedToken()?.userId ?? null;
export const getUserRoleFromToken = (): string | null => getDecodedToken()?.role ?? null;
export const getUserEmailFromToken = (): string | null => getDecodedToken()?.sub ?? null;

// Setup axios interceptors with auto-refresh
export const setupAxiosInterceptors = (onUnauthorized: () => void) => {
  // Remove existing interceptors if any
  let requestInterceptorId = axios.interceptors.request.use(
    async (config) => {
      const token = getToken();
      if (token) {
        // Validate token before each request
        const isValid = await isTokenValid(token);
        if (!isValid) {
          // Token is invalid or expiring soon, attempt refresh
          const refreshed = await refreshToken();
          if (!refreshed) {
            removeTokens();
            onUnauthorized();
            throw new Error('Invalid token');
          }
          // Get new token after refresh
          const newToken = getToken();
          if (!newToken) {
            throw new Error('Failed to get new token after refresh');
          }
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${newToken}`;
        } else {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  let responseInterceptorId = axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as CustomAxiosRequest;
      const isAuthRequest = originalRequest.url?.includes('/api/auth/');

      if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh token
          const refreshed = await refreshToken();
          if (!refreshed) {
            throw new Error('Token refresh failed');
          }

          // Get new token after refresh
          const newToken = getToken();
          if (!newToken) {
            throw new Error('Failed to get new token after refresh');
          }

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          removeTokens();
          if (!isAuthRequest) {
            onUnauthorized();
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  // Return cleanup function
  return () => {
    axios.interceptors.request.eject(requestInterceptorId);
    axios.interceptors.response.eject(responseInterceptorId);
  };
};

// Refresh token function
export const refreshToken = async (): Promise<boolean> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.error('No refresh token available');
      return false;
    }

    // Clear any existing tokens before refresh
    removeTokens();

    const response = await axios.post(
      'http://localhost:8080/api/auth/refresh',
      { refreshToken },
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    if (!accessToken || !newRefreshToken) {
      console.error('Invalid refresh response');
      return false;
    }

    return storeTokenAndSetAxiosHeader(accessToken, newRefreshToken);
  } catch (error) {
    console.error('Token refresh failed:', error);
    removeTokens();
    return false;
  }
};
