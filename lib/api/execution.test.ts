import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executionApi } from './execution';
import apiClient from '../apiClient';

// Mock the apiClient
vi.mock('../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('executionApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('run', () => {
    it('should call apiClient.post with code and input', async () => {
      const mockResponse = { data: { output: 'Hello World', error: null } };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await executionApi.run('print("Hello World")', '');

      expect(apiClient.post).toHaveBeenCalledWith('/execution/run', {
        code: 'print("Hello World")',
        input: '',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass input to the API', async () => {
      const mockResponse = { data: { output: '15', error: null } };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      await executionApi.run('print(int(input()) + int(input()))', '5\n10');

      expect(apiClient.post).toHaveBeenCalledWith('/execution/run', {
        code: 'print(int(input()) + int(input()))',
        input: '5\n10',
      });
    });

    it('should use empty string as default input', async () => {
      const mockResponse = { data: { output: 'test', error: null } };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      await executionApi.run('print("test")');

      expect(apiClient.post).toHaveBeenCalledWith('/execution/run', {
        code: 'print("test")',
        input: '',
      });
    });
  });

  describe('submit', () => {
    it('should call apiClient.post with questionId and code', async () => {
      const mockResponse = { 
        data: { 
          passed: true, 
          results: [{ input: '1 2', output: '3', expected: '3', passed: true }] 
        } 
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await executionApi.submit('q1', 'print(sum(map(int, input().split())))');

      expect(apiClient.post).toHaveBeenCalledWith('/execution/submit', {
        questionId: 'q1',
        code: 'print(sum(map(int, input().split())))',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from run', async () => {
      const error = new Error('Execution timeout');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(executionApi.run('while True: pass')).rejects.toThrow('Execution timeout');
    });

    it('should propagate errors from submit', async () => {
      const error = new Error('Question not found');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(executionApi.submit('invalid-id', 'code')).rejects.toThrow('Question not found');
    });
  });
});
