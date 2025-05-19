import axios from 'axios';
import { getToken } from '../utils/authUtils';

// Define interfaces for the data types
interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  keyword?: string;
}

interface Concert {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  price: number;
  location: string;
  category: string;
  imageurl?: string;
  artist?: string;
  genre?: string;
  openingAct?: string;
  duration?: string;
  capacity?: number;
}

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  recentPayments: any[];
  eventStats: {
    events: number;
    concerts: number;
    movies: number;
    sports: number;
  };
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8080/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to set auth token before each request
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`Request to ${config.url} - Authorization header set`);
    } else {
      console.error(`Request to ${config.url} - No token available`);
      throw new Error('No authentication token available');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });

      if (error.response.status === 401) {
        // Handle unauthorized error (invalid or expired token)
        console.error('Authentication token is invalid or expired');
      } else if (error.response.status === 403) {
        // Handle forbidden error (insufficient permissions)
        console.error('Insufficient permissions to access this resource');
      } else if (error.response.status === 404) {
        // Handle not found error
        console.error('Resource not found:', error.config.url);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Get dashboard statistics for admin
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get<DashboardStats>('/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    throw error;
  }
};

/**
 * Get sales data for charts with specified period
 */
export const getSalesData = async (period: 'daily' | 'weekly' | 'monthly' = 'weekly') => {
  try {
    const response = await api.get(`/sales?period=${period}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${period} sales data:`, error);
    throw error;
  }
};

/**
 * Get recent activity data for admin dashboard
 */
export const getRecentActivities = async () => {
  try {
    const response = await api.get('/activities');
    return response.data;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
};

/**
 * Get all users for admin dashboard
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

/**
 * Get all payments/transactions for admin dashboard
 */
export const getAllPayments = async () => {
  try {
    const response = await api.get('/payments');
    return response.data;
  } catch (error) {
    console.error('Error fetching all payments:', error);
    throw error;
  }
};

/**
 * Get all events with pagination and filtering
 */
export const getAllEvents = async (params: any = {}) => {
  try {
    const response = await api.get('/events', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching all events:', error);
    throw error;
  }
};

/**
 * Get all movies with pagination and filtering
 */
export const getAllMovies = async (params: any = {}) => {
  try {
    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token available for admin API call');
    }
    
    // Explicitly set auth header for this request
    const response = await api.get('/movies', { 
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Movies API response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching all movies:', error);
    console.error('Response data:', error.response?.data);
    console.error('Response status:', error.response?.status);
    throw error;
  }
};

/**
 * Get all concerts with pagination and filtering
 */
export const getAllConcerts = async (params: PaginationParams = {}) => {
  try {
    const response = await api.get<{ concerts: Concert[] }>('/concerts', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching all concerts:', error);
    throw error;
  }
};

/**
 * Get all sports with pagination and filtering
 */
export const getAllSports = async (params: any = {}) => {
  try {
    const response = await api.get('/sports', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching all sports:', error);
    throw error;
  }
};

/**
 * Get event by ID
 */
export const getEventById = async (id: string) => {
  try {
    const response = await api.get(`/events/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event by ID:', error);
    throw error;
  }
};

/**
 * Get movie by ID
 */
export const getMovieById = async (id: string) => {
  try {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching movie by ID:', error);
    throw error;
  }
};

/**
 * Get concert by ID
 */
export const getConcertById = async (id: string): Promise<Concert> => {
  try {
    const response = await api.get<Concert>(`/concerts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching concert by ID:', error);
    throw error;
  }
};

/**
 * Get sport by ID
 */
export const getSportById = async (id: string) => {
  try {
    const response = await api.get(`/sports/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sport by ID:', error);
    throw error;
  }
};

/**
 * Create new event
 */
export const createEvent = async (eventData: any) => {
  try {
    const response = await api.post('/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Create new movie
 */
export const createMovie = async (movieData: any) => {
  try {
    const response = await api.post('/movies', movieData);
    const createdMovie = response.data;
    if (!createdMovie.id) {
      console.warn('Created movie is missing ID in response');
    } else {
      console.log('Movie created successfully with ID:', createdMovie.id);
    }
    return createdMovie;
  } catch (error) {
    console.error('Error creating movie:', error);
    throw error;
  }
};

/**
 * Create new concert
 */
export const createConcert = async (concertData: Omit<Concert, 'id'>): Promise<Concert> => {
  try {
    const response = await api.post<Concert>('/concerts', concertData);
    return response.data;
  } catch (error) {
    console.error('Error creating concert:', error);
    throw error;
  }
};

/**
 * Create new sport
 */
export const createSport = async (sportData: any) => {
  try {
    const response = await api.post('/sports', sportData);
    const createdSport = response.data;
    if (!createdSport.id) {
      console.warn('Created sport is missing ID in response');
    } else {
      console.log('Sport created successfully with ID:', createdSport.id);
    }
    return createdSport;
  } catch (error) {
    console.error('Error creating sport:', error);
    throw error;
  }
};

/**
 * Update existing event
 */
export const updateEvent = async (id: string, eventData: any) => {
  try {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

/**
 * Update existing movie
 */
export const updateMovie = async (id: string, movieData: any) => {
  try {
    const response = await api.put(`/movies/${id}`, movieData);
    return response.data;
  } catch (error) {
    console.error('Error updating movie:', error);
    throw error;
  }
};

/**
 * Update existing concert
 */
export const updateConcert = async (id: string, concertData: Partial<Concert>): Promise<Concert> => {
  try {
    const response = await api.put<Concert>(`/concerts/${id}`, concertData);
    return response.data;
  } catch (error) {
    console.error('Error updating concert:', error);
    throw error;
  }
};

/**
 * Update existing sport
 */
export const updateSport = async (id: string, sportData: any) => {
  try {
    const response = await api.put(`/sports/${id}`, sportData);
    return response.data;
  } catch (error) {
    console.error('Error updating sport:', error);
    throw error;
  }
};

/**
 * Delete event by ID
 */
export const deleteEvent = async (id: string) => {
  try {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * Delete movie by ID
 */
export const deleteMovie = async (id: string) => {
  try {
    const response = await api.delete(`/movies/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting movie:', error);
    throw error;
  }
};

/**
 * Delete concert by ID
 */
export const deleteConcert = async (id: string): Promise<void> => {
  try {
    await api.delete(`/concerts/${id}`);
  } catch (error) {
    console.error('Error deleting concert:', error);
    throw error;
  }
};

/**
 * Delete sport by ID
 */
export const deleteSport = async (id: string) => {
  try {
    const response = await api.delete(`/sports/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting sport:', error);
    throw error;
  }
};

// Export all admin service functions
export default {
  getDashboardStats,
  getSalesData,
  getRecentActivities,
  getAllUsers,
  getAllPayments,
  getAllEvents,
  getAllMovies,
  getAllConcerts,
  getAllSports,
  getEventById,
  getMovieById,
  getConcertById,
  getSportById,
  createEvent,
  createMovie,
  createConcert,
  createSport,
  updateEvent,
  updateMovie,
  updateConcert,
  updateSport,
  deleteEvent,
  deleteMovie,
  deleteConcert,
  deleteSport
}; 