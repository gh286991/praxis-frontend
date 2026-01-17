import apiClient from '../apiClient';

/**
 * Questions API Module
 * 
 * Handles all question-related API calls:
 * - Getting next question
 * - Submitting answers
 * - Getting hints
 * - Question history
 */
export const questionsApi = {
  /**
   * Get next question for a category
   * @param category - Category slug
   * @param force - Force new question even if current one is not completed
   */
  getNext: async (category: string, force: boolean = false) => {
    const response = await apiClient.get(`/questions/next/${category}?force=${force}`);
    return response.data;
  },

  /**
   * Submit answer for a question
   */
  submitAnswer: async (questionId: string, code: string, isCorrect: boolean, category: string) => {
    const response = await apiClient.post(`/questions/${questionId}/submit`, {
      code,
      isCorrect,
      category,
    });
    return response.data;
  },

  /**
   * Get AI-generated hint for a question
   */
  getHint: async (questionId: string, code: string) => {
    const response = await apiClient.post('/questions/hint', {
      questionId,
      code,
    });
    return response.data;
  },

  /**
   * Get question history for a category
   */
  getHistory: async (category: string) => {
    const response = await apiClient.get(`/questions/history/${category}`);
    return response.data;
  },

  /**
   * Get question by ID
   */
  getById: async (id: string) => {
    const response = await apiClient.get(`/questions/${id}`);
    return response.data;
  },
};
