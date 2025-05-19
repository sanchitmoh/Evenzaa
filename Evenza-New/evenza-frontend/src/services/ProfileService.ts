import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

interface ProfileUpdateData {
  userId: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  phone?: string;
  address?: string;
}

interface ProfileResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    avatar?: string;
  };
}

const ProfileService = {
  /**
   * Update user profile
   */
  updateProfile: async (data: ProfileUpdateData): Promise<ProfileResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const formData = new FormData();
      formData.append('userId', data.userId);
      
      if (data.name) {
        formData.append('name', data.name);
      }
      if (data.email) {
        formData.append('email', data.email);
      }
      if (data.imageUrl) {
        formData.append('imageUrl', data.imageUrl);
      }
      if (data.phone) {
        formData.append('phone', data.phone);
      }
      if (data.address) {
        formData.append('address', data.address);
      }

      const response = await axios.put<ProfileResponse>(
        `${API_URL}/profile/update`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update profile');
      }
      throw error;
    }
  },

  /**
   * Get user profile
   */
  getProfile: async (userId: string): Promise<ProfileResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get<ProfileResponse>(
        `${API_URL}/profile/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get profile');
      }
      throw error;
    }
  }
};

export default ProfileService; 