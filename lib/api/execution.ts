import apiClient from '../apiClient';

/**
 * Execution API Module
 * 
 * Handles code execution and submission:
 * - Running code with optional input
 * - Submitting code for evaluation against test cases
 */
export const executionApi = {
  /**
   * Run code with optional input (for testing)
   */
  run: async (code: string, input: string = '') => {
    const response = await apiClient.post('/execution/run', { code, input });
    return response.data;
  },

  /**
   * Submit code for evaluation against test cases
   */
  submit: async (questionId: string, code: string) => {
    const response = await apiClient.post('/execution/submit', {
      questionId,
      code,
    });
    return response.data;
  },
};
