import apiClient from '../apiClient';

/**
 * Subjects API Module
 * 
 * Handles subject/course-related API calls
 */
export const subjectsApi = {
  /**
   * Get all active subjects
   */
  getAll: async () => {
    const response = await apiClient.get('/subjects');
    return response.data;
  },

  /**
   * Get subject by slug
   */
  getBySlug: async (slug: string) => {
    const response = await apiClient.get(`/subjects/${slug}`);
    return response.data;
  },
};

/**
 * Categories API Module
 * 
 * Handles category-related API calls
 */
export const categoriesApi = {
  /**
   * Get categories for a specific subject
   */
  getBySubject: async (subjectId: string) => {
    const response = await apiClient.get(`/categories/subject/${subjectId}`);
    return response.data;
  },
};
