import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRemoteExecution } from './useRemoteExecution';

// Helper to create a mock ReadableStream
function createMockStream(chunks: string[]) {
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(new TextEncoder().encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}

describe('useRemoteExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    vi.mocked(localStorage.getItem).mockReturnValue('mock-token');
  });

  describe('initial state', () => {
    it('should start with isLoading false', () => {
      const { result } = renderHook(() => useRemoteExecution());
      expect(result.current.isLoading).toBe(false);
    });

    it('should start with empty systemMessages', () => {
      const { result } = renderHook(() => useRemoteExecution());
      expect(result.current.systemMessages).toEqual([]);
    });

    it('should start with empty executionOutput', () => {
      const { result } = renderHook(() => useRemoteExecution());
      expect(result.current.executionOutput).toEqual([]);
    });
  });

  describe('clearMessages', () => {
    it('should clear both systemMessages and executionOutput', () => {
      const { result } = renderHook(() => useRemoteExecution());
      
      act(() => {
        result.current.clearMessages();
      });
      
      expect(result.current.systemMessages).toEqual([]);
      expect(result.current.executionOutput).toEqual([]);
    });
  });

  describe('runCodeWithStream', () => {
    it('should be a function', () => {
      const { result } = renderHook(() => useRemoteExecution());
      expect(typeof result.current.runCodeWithStream).toBe('function');
    });

    it('should set isLoading to true when called', async () => {
      // Mock fetch to hang
      vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}));
      
      const { result } = renderHook(() => useRemoteExecution());
      
      // Start the call but don't await
      act(() => {
        result.current.runCodeWithStream('print("test")');
      });
      
      // isLoading should be true while fetching
      expect(result.current.isLoading).toBe(true);
    });

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));
      
      const { result } = renderHook(() => useRemoteExecution());
      
      let response: { output: string; error: string | null } | undefined;
      await act(async () => {
        response = await result.current.runCodeWithStream('print("test")');
      });
      
      expect(response?.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle server errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response);
      
      const { result } = renderHook(() => useRemoteExecution());
      
      let response: { output: string; error: string | null } | undefined;
      await act(async () => {
        response = await result.current.runCodeWithStream('print("test")');
      });
      
      expect(response?.error).toContain('Server Error');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle successful streaming response', async () => {
      const mockStream = createMockStream([
        'data: {"status":"processing","message":"Running..."}\n\n',
        'data: {"status":"completed","data":{"output":"Hello World"}}\n\n',
      ]);
      
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      } as Response);
      
      const { result } = renderHook(() => useRemoteExecution());
      
      let response: { output: string; error: string | null } | undefined;
      await act(async () => {
        response = await result.current.runCodeWithStream('print("Hello World")');
      });
      
      expect(response?.output).toBe('Hello World');
      expect(response?.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('submitCodeWithStream', () => {
    it('should be a function', () => {
      const { result } = renderHook(() => useRemoteExecution());
      expect(typeof result.current.submitCodeWithStream).toBe('function');
    });

    it('should handle submission with test results', async () => {
      const mockStream = createMockStream([
        'data: {"status":"processing","message":"Evaluating..."}\n\n',
        'data: {"status":"test_case_completed","data":{"testIndex":0,"testCase":{"passed":true}}}\n\n',
        'data: {"status":"completed","data":{"passed":true,"results":[{"input":"1","output":"1","expected":"1","passed":true}]}}\n\n',
      ]);
      
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      } as Response);
      
      const { result } = renderHook(() => useRemoteExecution());
      
      let response: { output: string; error: string | null; passed?: boolean; results?: any[] } | undefined;
      await act(async () => {
        response = await result.current.submitCodeWithStream('print(input())', 'q1');
      });
      
      expect(response?.passed).toBe(true);
      expect(response?.results).toHaveLength(1);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle submission errors', async () => {
      const mockStream = createMockStream([
        'data: {"status":"error","message":"Question not found"}\n\n',
      ]);
      
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      } as Response);
      
      const { result } = renderHook(() => useRemoteExecution());
      
      let response: { output: string; error: string | null } | undefined;
      await act(async () => {
        response = await result.current.submitCodeWithStream('code', 'invalid-id');
      });
      
      expect(response?.error).toBe('Question not found');
    });
  });

  describe('hook interface', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useRemoteExecution());
      
      expect(result.current).toHaveProperty('runCodeWithStream');
      expect(result.current).toHaveProperty('submitCodeWithStream');
      expect(result.current).toHaveProperty('systemMessages');
      expect(result.current).toHaveProperty('executionOutput');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('clearMessages');
    });
  });
});
