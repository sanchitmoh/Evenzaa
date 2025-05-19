import axios from 'axios';
import { getToken } from '../utils/authUtils';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Generic API methods
export const apiService = {
  // GET request
  get: async <T>(endpoint: string, params = {}): Promise<T> => {
    try {
      const response = await api.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  },

  // POST request
  post: async <T>(endpoint: string, data = {}): Promise<T> => {
    try {
      const response = await api.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error posting to ${endpoint}:`, error);
      throw error;
    }
  },

  // PUT request
  put: async <T>(endpoint: string, data = {}): Promise<T> => {
    try {
      const response = await api.put<T>(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating ${endpoint}:`, error);
      throw error;
    }
  },

  // DELETE request
  delete: async <T>(endpoint: string): Promise<T> => {
    try {
      const response = await api.delete<T>(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error deleting ${endpoint}:`, error);
      throw error;
    }
  },
};

export default apiService;