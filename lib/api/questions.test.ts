import { describe, it, expect, vi, beforeEach } from 'vitest';
import { questionsApi } from './questions';
import apiClient from '../apiClient';

// Mock the apiClient
vi.mock('../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('questionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNext', () => {
    it('should call apiClient.get with correct URL for category', async () => {
      const mockResponse = { data: { _id: 'q1', title: 'Test Question' } };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await questionsApi.getNext('python-basics');

      expect(apiClient.get).toHaveBeenCalledWith('/questions/next/python-basics?force=false');
      expect(result).toEqual(mockResponse.data);
    });

    it('should include force=true when force parameter is true', async () => {
      const mockResponse = { data: { _id: 'q2', title: 'New Question' } };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      await questionsApi.getNext('python-basics', true);

      expect(apiClient.get).toHaveBeenCalledWith('/questions/next/python-basics?force=true');
    });
  });

  describe('submitAnswer', () => {
    it('should call apiClient.post with correct data', async () => {
      const mockResponse = { data: { success: true } };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await questionsApi.submitAnswer('q1', 'print("hello")', true, 'python-basics');

      expect(apiClient.post).toHaveBeenCalledWith('/questions/q1/submit', {
        code: 'print("hello")',
        isCorrect: true,
        category: 'python-basics',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getHint', () => {
    it('should call apiClient.post with questionId and code', async () => {
      const mockResponse = { data: { hint: 'Try using a loop' } };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await questionsApi.getHint('q1', 'print("test")');

      expect(apiClient.post).toHaveBeenCalledWith('/questions/hint', {
        questionId: 'q1',
        code: 'print("test")',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getHistory', () => {
    it('should call apiClient.get with correct category', async () => {
      const mockResponse = { data: [{ questionId: 'q1', isCorrect: true }] };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await questionsApi.getHistory('python-basics');

      expect(apiClient.get).toHaveBeenCalledWith('/questions/history/python-basics');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getById', () => {
    it('should call apiClient.get with question ID', async () => {
      const mockResponse = { data: { _id: 'q1', title: 'Test Question' } };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await questionsApi.getById('q1');

      expect(apiClient.get).toHaveBeenCalledWith('/questions/q1');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from apiClient', async () => {
      const error = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      await expect(questionsApi.getNext('python-basics')).rejects.toThrow('Network error');
    });
  });
});
