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
  getHint: async (questionId: string, code: string, type: 'logic' | 'code' = 'code') => {
    const response = await apiClient.post('/questions/hint', {
      questionId,
      code,
      type,
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

  /**
   * Get chat history for a question
   */
  getChatHistory: async (questionId: string, limit: number = 20, before?: string) => {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (before) query.append('before', before);
    
    const response = await apiClient.get(`/questions/${questionId}/chat-history?${query.toString()}`);
    return response.data;
  },

  /**
   * Chat with AI Tutor
   */
  chatWithTutor: async (questionId: string, code: string, chatHistory: any[], message: string) => {
    // Redirect to our custom proxy handler (moved to /ai-proxy to avoid Next.js rewrite conflict)
    // Path: /ai-proxy/questions/chat (handled by app/ai-proxy/[...path]/route.ts)
    // We use fetch directly to avoid apiClient automatically adding '/api' prefix
    const response = await fetch('/ai-proxy/questions/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            questionId,
            code,
            chatHistory,
            message
        })
    });
    
    if (!response.ok) {
        throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json(); // { response: "..." }
  }
};
