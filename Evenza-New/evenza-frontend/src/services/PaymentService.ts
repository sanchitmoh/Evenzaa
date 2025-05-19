import axios from 'axios';

const API_URL = 'http://localhost:8080/api';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
const REQUEST_TIMEOUT = 5000; // 5 seconds timeout

interface Payment {
  id: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number;
  status: string;
  entityType: string;
  entityId: string;
  userId?: string;
  paymentMethod: string;
  createdAt: string;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
}

// Cache for payment data
const paymentCache: {
  [key: string]: CachedData<Payment[]>
} = {};

// Helper function to normalize user ID
const normalizeUserId = (userId: string | number | null | undefined): string | null => {
  if (userId === null || userId === undefined) return null;
  if (typeof userId === 'number') {
    return userId.toString();
  }
  return userId;
};

// Helper function to get user ID from local storage
const getUserIdFromStorage = (): string | null => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    const parsed = JSON.parse(userData);
    const userId = parsed.uuid || parsed.userId || parsed.id;
    return userId ? normalizeUserId(userId) : null;
  } catch (e) {
    console.error('Error parsing user data:', e);
    return null;
  }
};

export const PaymentService = {
  /**
   * Get payment history for a specific user
   */
  getUserPaymentHistory: async (userId: string | number | null | undefined): Promise<Payment[]> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const finalUserId = normalizeUserId(userId);
      if (!finalUserId) {
        console.error('PaymentService: Invalid user ID provided:', userId);
        throw new Error('Invalid user ID');
      }
      
      console.log(`PaymentService: Fetching for user ID [${finalUserId}]`);
      
      // Check cache first
      const cacheKey = `user_payments_${finalUserId}`;
      const cachedPayments = paymentCache[cacheKey];
      const now = Date.now();
      
      if (cachedPayments && (now - cachedPayments.timestamp < CACHE_EXPIRY)) {
        console.log('PaymentService: Returning cached payment data');
        return cachedPayments.data;
      }
      
      // Try endpoints in order of preference with explicit headers
      const endpoints = [
        `${API_URL}/payment/user/${finalUserId}`,
        `${API_URL}/payment/by-user?userId=${finalUserId}`
      ];
      
      // Create an axios instance with default settings
      const instance = axios.create({
        timeout: REQUEST_TIMEOUT,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Also check localStorage for offline/fallback data
      let localStorageData: Payment[] = [];
      try {
        const storedPayments = localStorage.getItem('userPayments');
        if (storedPayments) {
          const allPayments = JSON.parse(storedPayments) as Payment[];
          localStorageData = allPayments.filter(p => 
            p.userId?.toString() === finalUserId || !p.userId
          );
        }
      } catch (e) {
        console.error('Error parsing localStorage payments:', e);
      }
      
      // Try each endpoint in sequence until one works
      let paymentData: Payment[] = [];
      let lastError: Error | null = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`PaymentService: Trying endpoint ${endpoint}`);
          const response = await instance.get(endpoint);
          
          if (response.data && Array.isArray(response.data)) {
            paymentData = response.data;
            console.log(`PaymentService: Successfully retrieved ${paymentData.length} payments from ${endpoint}`);
            break;
          } else {
            console.warn(`PaymentService: Endpoint ${endpoint} returned invalid data format`, response.data);
          }
        } catch (error) {
          console.warn(`PaymentService: Endpoint ${endpoint} failed:`, error);
          lastError = error as Error;
        }
      }
      
      // Fall back to localStorage if no endpoint succeeded
      if (paymentData.length === 0 && localStorageData.length > 0) {
        console.log('PaymentService: Using localStorage fallback data');
        paymentData = localStorageData;
      } else if (paymentData.length === 0 && lastError) {
        // If we have no data at all, throw the last error
        throw lastError;
      }
      
      // Cache the result
      paymentCache[cacheKey] = {
        data: paymentData,
        timestamp: now
      };
      
      // Update localStorage with new data if we got any from the API
      if (paymentData.length > 0 && paymentData !== localStorageData) {
        try {
          localStorage.setItem('userPayments', JSON.stringify(paymentData));
        } catch (e) {
          console.error('Error saving payments to localStorage:', e);
          // Continue even if localStorage fails
        }
      }
      
      return paymentData;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      
      // Last resort: try localStorage if everything else failed
      try {
        const storedPayments = localStorage.getItem('userPayments');
        if (storedPayments) {
          const allPayments = JSON.parse(storedPayments) as Payment[];
          const finalUserId = normalizeUserId(userId);
          if (finalUserId) {
            const userPayments = allPayments.filter(p => 
              p.userId?.toString() === finalUserId || !p.userId
            );
            
            if (userPayments.length > 0) {
              console.log('PaymentService: Using emergency localStorage fallback');
              return userPayments;
            }
          }
        }
      } catch (e) {
        console.error('Error with localStorage emergency fallback:', e);
      }
      
      throw error;
    }
  },

  /**
   * Get payment details for a specific payment ID
   */
  getPaymentDetails: async (paymentId: string): Promise<Payment> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Try to get from cache first
      const userId = getUserIdFromStorage();
      if (userId) {
        const userPaymentsKey = `user_payments_${userId}`;
        const cachedUserPayments = paymentCache[userPaymentsKey];
        
        if (cachedUserPayments) {
          const cachedPayment = cachedUserPayments.data.find(p => 
            p.id.toString() === paymentId || p.razorpayPaymentId === paymentId
          );
          
          if (cachedPayment) {
            console.log('PaymentService: Using cached payment details');
            return cachedPayment;
          }
        }
      }
      
      console.log(`PaymentService: Fetching payment details for ID ${paymentId}`);
      const response = await axios.get(`${API_URL}/payment/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: REQUEST_TIMEOUT
      });
      
      if (!response.data || (typeof response.data === 'object' && 'error' in response.data)) {
        throw new Error(
          typeof response.data === 'object' && 'error' in response.data 
            ? response.data.error 
            : 'Invalid payment data received'
        );
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      
      // Try to find the payment in localStorage
      try {
        const storedPayments = localStorage.getItem('userPayments');
        if (storedPayments) {
          const allPayments = JSON.parse(storedPayments) as Payment[];
          const payment = allPayments.find(p => 
            p.id.toString() === paymentId || p.razorpayPaymentId === paymentId
          );
          
          if (payment) {
            console.log('PaymentService: Using localStorage payment details fallback');
            return payment;
          }
        }
      } catch (e) {
        console.error('Error with localStorage payment details fallback:', e);
      }
      
      throw error;
    }
  },
  
  /**
   * Clear the payment cache
   */
  clearCache: () => {
    Object.keys(paymentCache).forEach(key => {
      delete paymentCache[key];
    });
    console.log('PaymentService: Cache cleared');
  }
};

export default PaymentService; 