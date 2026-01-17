import apiClient from '../apiClient';

/**
 * Users API Module
 * 
 * Handles user profile management and usage statistics
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

  /**
   * Get user's AI usage statistics
   */
  getUsageStats: async () => {
    const response = await apiClient.get('/usage/stats');
    return response.data;
  },

  /**
   * Get user's usage history with optional date range
   */
  getUsageHistory: async (params?: { from?: string; to?: string }) => {
    const response = await apiClient.get('/usage/history', { params });
    return response.data;
  },
};
