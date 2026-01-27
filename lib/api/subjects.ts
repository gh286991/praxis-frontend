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
  /**
   * Import mock exam
   */
  importMockExam: async (file: File, subjectId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (subjectId) {
      formData.append('subjectId', subjectId);
    }
    
    // Note: The backend endpoint is currently at /import/mock-exam
    // We should probably move it to /subjects/import or similar, but for now we use the existing one
    const response = await apiClient.post('/import/mock-exam', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
