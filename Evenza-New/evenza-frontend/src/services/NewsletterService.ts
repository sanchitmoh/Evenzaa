import axios from 'axios';

const API_URL = 'http://localhost:8080/api/newsletter';

/**
 * Service for handling newsletter subscriptions
 */
class NewsletterService {
  /**
   * Subscribe to the newsletter
   * @param email The email to subscribe
   * @returns Promise with the API response
   */
  async subscribe(email: string) {
    try {
      const response = await axios.post(`${API_URL}/subscribe`, { email });
      return response.data;
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from the newsletter
   * @param email The email to unsubscribe
   * @returns Promise with the API response
   */
  async unsubscribe(email: string) {
    try {
      const response = await axios.post(`${API_URL}/unsubscribe`, { email });
      return response.data;
    } catch (error) {
      console.error('Newsletter unsubscription error:', error);
      throw error;
    }
  }
}

export default new NewsletterService(); 