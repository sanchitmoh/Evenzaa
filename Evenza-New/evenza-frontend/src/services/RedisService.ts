import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:8080/api';

interface TicketStatus {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  message: string;
  timestamp?: number;
  ticketId?: string;
  pdfUrl?: string;
  error?: string;
}

interface PaymentData {
  valid: boolean;
  paymentId: string;
  status: string;
  bookingId?: string;
  message?: string;
  ticketStatus?: string;
  error?: string;
}

/**
 * Service to interact with Redis-cached data on the backend
 */
const RedisService = {
  /**
   * Get ticket generation status from Redis with exponential backoff
   * @param bookingId The booking ID to check status for
   * @param maxAttempts Maximum number of polling attempts
   * @param initialDelay Initial delay between polls in milliseconds
   */
  getTicketStatus: async (
    bookingId: string,
    maxAttempts: number = 10,
    initialDelay: number = 1000
  ): Promise<TicketStatus> => {
    let attempts = 0;
    let delay = initialDelay;

    const poll = async (): Promise<TicketStatus> => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await axios.get<TicketStatus>(`${API_URL}/tickets/status/booking/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 3000 // Quick timeout to ensure fast response
        });

        const status = response.data.status;
        
        // If ticket is complete or error, return immediately
        if (status === 'COMPLETED' || status === 'ERROR') {
          return response.data;
        }

        // If we've reached max attempts, return current status
        if (attempts >= maxAttempts) {
          return response.data;
        }

        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 5000); // Cap at 5 seconds
        attempts++;

        // Continue polling
        return poll();
      } catch (error: unknown) {
        console.error('Error polling ticket status:', error);
        if (error instanceof AxiosError) {
          throw new Error(`Failed to get ticket status: ${error.message}`);
        }
        throw error;
      }
    };

    return poll();
  },

  /**
   * Get payment data from Redis
   * @param paymentId The payment ID to retrieve
   */
  getPayment: async (paymentId: string): Promise<PaymentData> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get<PaymentData>(`${API_URL}/payment/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 3000
      });

      return response.data;
    } catch (error: unknown) {
      console.error('Error getting payment data from Redis:', error);
      if (error instanceof AxiosError) {
        throw new Error(`Failed to get payment data: ${error.message}`);
      }
      throw error;
    }
  },
  
  /**
   * Poll for ticket generation status until complete
   * @param bookingId The booking ID to check status for
   * @param maxRetries Maximum number of retry attempts
   * @param retryInterval Time between retries in milliseconds
   */
  pollTicketStatus: async (
    bookingId: string, 
    maxRetries: number = 10, 
    retryInterval: number = 1000
  ): Promise<any> => {
    let retries = 0;
    
    const poll = async (): Promise<any> => {
      try {
        const status = await RedisService.getTicketStatus(bookingId);
        
        // If status is completed or error, return immediately
        if (status.status === 'COMPLETED' || status.status === 'ERROR') {
          return status;
        }
        
        // If we've reached max retries, return the current status
        if (retries >= maxRetries) {
          return {
            ...status,
            _timedOut: true,
            message: `Polling timed out after ${maxRetries} attempts. ${status.message || ''}`
          };
        }
        
        // Increment retry counter
        retries++;
        
        // Wait for the retry interval
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        
        // Recursively try again
        return poll();
      } catch (error) {
        // If there's an error, increment retry counter and try again if possible
        retries++;
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Wait for the retry interval
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        
        // Try again
        return poll();
      }
    };
    
    return poll();
  }
};

export default RedisService; 