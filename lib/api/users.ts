import apiClient from '../apiClient';

/**
 * Users API Module
 * 
 * Handles user profile management
 */
export const usersApi = {
  /**
   * Get current user's profile
   */
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: { displayName?: string; bio?: string }) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },
};
