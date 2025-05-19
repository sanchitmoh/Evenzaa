import axios from "axios";
import { 
  storeTokenAndSetAxiosHeader, 
  removeTokens, 
  getToken, 
  isTokenValid,
  getUserIdFromToken,
  getUserRoleFromToken,
  getUserEmailFromToken,
  setupAxiosInterceptors
} from "../utils/authUtils";


const AUTH_API_BASE_URL = "http://localhost:8080/api/auth";

interface UserData {
  username: string;
  email: string;
  password: string;
}
interface LoginData {
  email: string;
  password: string;
}
interface LoginResponse {
  token: string;
  refreshToken: string;
  type: string;
  id: number;
  name: string;
  email: string;
  role: string;
}
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export const registerUser = async (userData: UserData): Promise<RegisterResponse> => {
  try {
    const response = await axios.post(
      `${AUTH_API_BASE_URL}/register`,
      userData,
      {
        withCredentials: true, // ✅ this is crucial
      }
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Registration failed:", error.response?.data || error.message);
    } else {
      console.error("Registration failed:", error);
    }
    throw error;
  }
};





export const loginUser = async (loginData: LoginData): Promise<User> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${AUTH_API_BASE_URL}/login`,
      loginData,
      {
        withCredentials: true,
      }
    );
    
    const { token, refreshToken, id, name, email, role } = response.data;
    
    // Store tokens and set axios header
    storeTokenAndSetAxiosHeader(token, refreshToken);
    
    // Store user info
    const user = { id, name, email, role };
    localStorage.setItem("user", JSON.stringify(user));
    
    return user;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Login failed:", error.response?.data || error.message);
    } else {
      console.error("Login failed:", error);
    }
    throw error;
  }
};


interface FirebaseLoginResponse {
  token: string;
  refreshToken?: string;
  user: {
    id?: string;
    uid?: string;
    name: string;
    email: string;
    role?: string;
  };
  status?: string;
  message?: string;
}

// Sends the Firebase ID token to the backend for verification
export const firebaseLogin = async (idToken: string): Promise<FirebaseLoginResponse> => {
  try {
    console.log("Sending Firebase token to backend (length:", idToken.length, ")");
    
    // Ensure the token is properly formatted
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('Invalid token format');
    }
    
    // Log first and last few characters of token for debugging
    console.log(`Token prefix: ${idToken.substring(0, 10)}... suffix: ...${idToken.substring(idToken.length - 10)}`);
    
    // Create a simple object with the token property
    const requestData = { token: idToken };
    
    console.log("Request payload:", JSON.stringify(requestData));
    
    // Use axios instead of fetch for consistency
    const response = await axios.post(
      `${AUTH_API_BASE_URL}/firebase-login`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    
    console.log("Firebase login response:", response.data);
    
    if (response.data.token) {
      // Store tokens using consistent function to ensure proper storage
      const success = storeTokenAndSetAxiosHeader(
        response.data.token, 
        response.data.refreshToken
      );
      
      if (!success) {
        console.error("Failed to store tokens");
      }
      
      // Store user info
      const userData = {
        id: response.data.user.id || response.data.user.uid || '',
        name: response.data.user.name || '',
        email: response.data.user.email || '',
        role: response.data.user.role || 'USER'
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      return response.data;
    } else {
      throw new Error('No token received from server');
    }
  } catch (error) {
    console.error("Firebase login failed:", error);
    if (error instanceof Error) {
      return { 
        status: 'error', 
        message: error.message,
        token: '',
        user: { name: '', email: '' }
      };
    } else {
      return { 
        status: 'error', 
        message: 'Unknown error occurred',
        token: '',
        user: { name: '', email: '' }
      };
    }
  }
};

  export const logout = () => {
    removeTokens();
    localStorage.removeItem("user");
  };
  
  export const getCurrentUser = (): User | null => {
    try {
      // First check if we have a stored user
      const userStr = localStorage.getItem("user");
      if (userStr) {
        return JSON.parse(userStr);
      }
      
      // If not, but we have a valid token, extract user info from token
      if (isTokenValid()) {
        const id = getUserIdFromToken();
        const email = getUserEmailFromToken();
        const role = getUserRoleFromToken();
        
        if (id && email) {
          const user = {
            id,
            name: email.split('@')[0], // Fallback name if not available
            email,
            role: role || 'USER'
          };
          
          // Store for future use
          localStorage.setItem("user", JSON.stringify(user));
          return user;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  };
  
  export const isAuthenticated = (): boolean => {
    return isTokenValid() && !!getCurrentUser();
  };
  
  export const initializeAuth = (navigate: any) => {
    // Setup axios interceptors for token refresh
    setupAxiosInterceptors(navigate);
    
    // Check token validity
    if (!isTokenValid()) {
      removeTokens();
      localStorage.removeItem("user");
    }
  };
  
  // Add refresh token functionality
  export const refreshAuthToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;
 
      
      const response = await axios.post('/api/auth/refresh', { refreshToken });
      const { token, newRefreshToken } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      return true;
     
      
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      return false;
    }
  };
  
  const authService = {
    registerUser,
    loginUser,
    firebaseLogin,
    logout,
    getCurrentUser,
    isAuthenticated,
    initializeAuth
  };
  
  export default authService;
  
