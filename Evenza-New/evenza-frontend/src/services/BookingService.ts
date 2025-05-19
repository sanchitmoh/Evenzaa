import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

interface Booking {
  id: number;
  seatId: string;
  entityType: string;
  entityId: string;
  userId: string;
  paymentId: string;
  amount: number;
  bookingTime: string;
  venue?: string;
}

export const BookingService = {
  /**
   * Get booking history for a specific user
   */
  getUserBookings: async (userId: string): Promise<Booking[]> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      console.log(`BookingService: Fetching for user ID [${userId}]`);
      
      // Get user data to ensure we're using the correct ID format
      const storedUserData = localStorage.getItem('user');
      let finalUserId = userId;
      
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          // If user ID is a number in localStorage, make sure we're using that format for API calls
          if (typeof userData.id === 'number') {
            finalUserId = userData.id.toString();
            console.log(`BookingService: Using numeric ID format: ${finalUserId}`);
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      // Try different API endpoints in sequence to determine which one works
      try {
        // First try the user/{userId} endpoint
        console.log(`BookingService: Trying endpoint /bookings/user/${finalUserId}`);
        const response = await axios.get(`${API_URL}/bookings/user/${finalUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('BookingService: Successful response from /bookings/user/ endpoint', response.data);
        return response.data;
      } catch (error1) {
        console.warn('First booking endpoint failed:', error1);
        
        // If first endpoint fails, try the alternate endpoint
        console.log(`BookingService: Trying endpoint /bookings/current-user`);
        const response = await axios.get(`${API_URL}/bookings/current-user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('BookingService: Successful response from /bookings/current-user endpoint', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching booking history:', error);
      throw error;
    }
  },
  
  /**
   * Get bookings for a test user (for debugging) by loading from localStorage
   */
  getLocalBookings: (): Booking[] => {
    try {
      const localBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
      console.log('Local bookings loaded:', localBookings);
      return localBookings;
    } catch (error) {
      console.error('Error reading local bookings:', error);
      return [];
    }
  }
};

export default BookingService; 