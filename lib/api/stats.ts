import apiClient from '../apiClient';

/**
 * Stats API Module
 * 
 * Handles statistics and progress tracking
 */
export const statsApi = {
  /**
   * Get all user statistics across all subjects
   */
  getAll: async () => {
    const response = await apiClient.get('/stats');
    return response.data;
  },

  /**
   * Get statistics for a specific subject
   */
  getSubject: async (slug: string) => {
    const response = await apiClient.get(`/stats/subject/${slug}`);
    return response.data;
  },

  /**
   * Get platform-wide statistics (public)
   */
  getPlatform: async () => {
    const response = await apiClient.get('/stats/platform');
    return response.data;
  },
};
