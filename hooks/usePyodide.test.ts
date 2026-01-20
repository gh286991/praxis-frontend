import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePyodide } from './usePyodide';

// Create a mock Pyodide instance
const createMockPyodide = () => ({
  runPythonAsync: vi.fn(),
  setStdout: vi.fn(),
  setStderr: vi.fn(),
  setStdin: vi.fn(),
  FS: {
    writeFile: vi.fn(),
  },
});

describe('usePyodide', () => {
  let originalLoadPyodide: any;
  let originalPyodide: any;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    vi.clearAllMocks();
    // Save original window state
    originalLoadPyodide = (window as any).loadPyodide;
    originalPyodide = (window as any).pyodide;
    originalCreateElement = document.createElement.bind(document);
    // Reset window state
    (window as any).loadPyodide = undefined;
    (window as any).pyodide = undefined;
  });

  afterEach(() => {
    // Restore window state
    (window as any).loadPyodide = originalLoadPyodide;
    (window as any).pyodide = originalPyodide;
  });

  describe('initial state', () => {
    it('should start with isLoading true', () => {
      const { result } = renderHook(() => usePyodide());
      expect(result.current.isLoading).toBe(true);
    });

    it('should start with empty output array', () => {
      const { result } = renderHook(() => usePyodide());
      expect(result.current.output).toEqual([]);
    });
  });

  describe('script loading', () => {
    it('should create a script element when loadPyodide is not available', () => {
      // We track createElement calls
      const createdElements: HTMLElement[] = [];
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'script') {
          createdElements.push(element);
        }
        return element;
      });
      
      renderHook(() => usePyodide());
      
      // Check that a script was created
      const scriptElement = createdElements.find(el => el.tagName === 'SCRIPT');
      expect(scriptElement).toBeDefined();
      expect((scriptElement as HTMLScriptElement)?.src).toContain('pyodide.js');
      
      createElementSpy.mockRestore();
    });

    it('should handle script load success and initialize Pyodide', async () => {
      const mockPyodide = createMockPyodide();
      let capturedScript: HTMLScriptElement | null = null;
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'script') {
          capturedScript = element as HTMLScriptElement;
        }
        return element;
      });
      
      const { result } = renderHook(() => usePyodide());
      
      // Set up window.loadPyodide before triggering onload
      (window as any).loadPyodide = vi.fn().mockResolvedValue(mockPyodide);
      
      // Trigger onload
      if (capturedScript?.onload) {
        await act(async () => {
          await (capturedScript!.onload as Function)(new Event('load'));
        });
      }
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect((window as any).loadPyodide).toHaveBeenCalled();
      
      createElementSpy.mockRestore();
    });

    it('should handle script load error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let capturedScript: HTMLScriptElement | null = null;
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'script') {
          capturedScript = element as HTMLScriptElement;
        }
        return element;
      });
      
      const { result } = renderHook(() => usePyodide());
      
      // Trigger onerror
      if (capturedScript?.onerror) {
        await act(async () => {
          (capturedScript!.onerror as Function)(new Error('Failed to load'));
        });
      }
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load Pyodide script from CDN',
        expect.anything()
      );
      
      consoleErrorSpy.mockRestore();
      createElementSpy.mockRestore();
    });

    it('should handle Pyodide initialization error after script load', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let capturedScript: HTMLScriptElement | null = null;
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'script') {
          capturedScript = element as HTMLScriptElement;
        }
        return element;
      });
      
      const { result } = renderHook(() => usePyodide());
      
      // Set up window.loadPyodide to reject
      (window as any).loadPyodide = vi.fn().mockRejectedValue(new Error('Init failed'));
      
      if (capturedScript?.onload) {
        await act(async () => {
          await (capturedScript!.onload as Function)(new Event('load'));
        });
      }
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize Pyodide:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
      createElementSpy.mockRestore();
    });
  });

  describe('when window.loadPyodide already exists', () => {
    it('should use existing loadPyodide without creating script', async () => {
      const mockPyodide = createMockPyodide();
      (window as any).loadPyodide = vi.fn().mockResolvedValue(mockPyodide);
      
      const createElementSpy = vi.spyOn(document, 'createElement');
      
      const { result } = renderHook(() => usePyodide());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Should not create a script element for pyodide
      const scriptCalls = createElementSpy.mock.calls.filter(
        call => call[0] === 'script'
      );
      expect(scriptCalls.length).toBe(0);
      expect((window as any).loadPyodide).toHaveBeenCalled();
      
      createElementSpy.mockRestore();
    });

    it('should handle re-initialization error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (window as any).loadPyodide = vi.fn().mockRejectedValue(new Error('Re-init failed'));
      
      const { result } = renderHook(() => usePyodide());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to re-initialize Pyodide:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearOutput', () => {
    it('should clear the output array', async () => {
      const { result } = renderHook(() => usePyodide());
      
      act(() => {
        result.current.clearOutput();
      });
      
      expect(result.current.output).toEqual([]);
    });
  });

  describe('runCode', () => {
    it('should return error when Pyodide is not loaded', async () => {
      const { result } = renderHook(() => usePyodide());
      
      let runResult: { output: string; error: string | null } | undefined;
      await act(async () => {
        runResult = await result.current.runCode('print("test")');
      });
      
      expect(runResult?.error).toBe('Pyodide is not loaded yet');
      expect(runResult?.output).toBe('');
    });

    it('should execute code successfully when Pyodide is loaded', async () => {
      const mockPyodide = createMockPyodide();
      mockPyodide.runPythonAsync.mockResolvedValue(undefined);
      
      // Capture the stdout handler
      let stdoutHandler: ((msg: string) => void) | null = null;
      mockPyodide.setStdout.mockImplementation(({ batched }: { batched: (msg: string) => void }) => {
        stdoutHandler = batched;
      });
      
      (window as any).loadPyodide = vi.fn().mockResolvedValue(mockPyodide);
      
      const { result } = renderHook(() => usePyodide());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      let runResult: { output: string; error: string | null } | undefined;
      await act(async () => {
        // Simulate output during execution
        mockPyodide.runPythonAsync.mockImplementation(async () => {
          if (stdoutHandler) {
            stdoutHandler('Hello World');
          }
        });
        runResult = await result.current.runCode('print("Hello World")');
      });
      
      expect(mockPyodide.setStdout).toHaveBeenCalled();
      expect(mockPyodide.setStderr).toHaveBeenCalled();
      expect(mockPyodide.runPythonAsync).toHaveBeenCalledWith('print("Hello World")');
      expect(runResult?.output).toBe('Hello World');
      expect(runResult?.error).toBeNull();
    });

    it('should handle code execution with input', async () => {
      const mockPyodide = createMockPyodide();
      mockPyodide.runPythonAsync.mockResolvedValue(undefined);
      
      (window as any).loadPyodide = vi.fn().mockResolvedValue(mockPyodide);
      
      const { result } = renderHook(() => usePyodide());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      await act(async () => {
        await result.current.runCode('x = input()', 'test input');
      });
      
      expect(mockPyodide.setStdin).toHaveBeenCalled();
    });

    it('should handle code execution with file assets', async () => {
      const mockPyodide = createMockPyodide();
      mockPyodide.runPythonAsync.mockResolvedValue(undefined);
      
      (window as any).loadPyodide = vi.fn().mockResolvedValue(mockPyodide);
      
      const { result } = renderHook(() => usePyodide());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      await act(async () => {
        await result.current.runCode('open("test.txt")', '', { 'test.txt': 'file content' });
      });
      
      expect(mockPyodide.FS.writeFile).toHaveBeenCalledWith('test.txt', 'file content');
    });

    it('should handle code execution errors', async () => {
      const mockPyodide = createMockPyodide();
      mockPyodide.runPythonAsync.mockRejectedValue(new Error('SyntaxError: invalid syntax'));
      
      (window as any).loadPyodide = vi.fn().mockResolvedValue(mockPyodide);
      
      const { result } = renderHook(() => usePyodide());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      let runResult: { output: string; error: string | null } | undefined;
      await act(async () => {
        runResult = await result.current.runCode('print(');
      });
      
      expect(runResult?.error).toContain('SyntaxError');
    });

    it('should handle stderr output', async () => {
      const mockPyodide = createMockPyodide();
      mockPyodide.runPythonAsync.mockResolvedValue(undefined);
      
      let stderrHandler: ((msg: string) => void) | null = null;
      mockPyodide.setStderr.mockImplementation(({ batched }: { batched: (msg: string) => void }) => {
        stderrHandler = batched;
      });
      
      (window as any).loadPyodide = vi.fn().mockResolvedValue(mockPyodide);
      
      const { result } = renderHook(() => usePyodide());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      await act(async () => {
        mockPyodide.runPythonAsync.mockImplementation(async () => {
          if (stderrHandler) {
            stderrHandler('Warning message');
          }
        });
        await result.current.runCode('some code');
      });
      
      expect(result.current.output).toContain('Error: Warning message');
    });

    it('should reset output on each run', async () => {
      const mockPyodide = createMockPyodide();
      mockPyodide.runPythonAsync.mockResolvedValue(undefined);
      
      (window as any).loadPyodide = vi.fn().mockResolvedValue(mockPyodide);
      
      const { result } = renderHook(() => usePyodide());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // First run
      await act(async () => {
        await result.current.runCode('print("first")');
      });
      
      // Second run should reset
      await act(async () => {
        await result.current.runCode('print("second")');
      });
      
      expect(mockPyodide.runPythonAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('hook interface', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => usePyodide());
      
      expect(result.current).toHaveProperty('runCode');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('output');
      expect(result.current).toHaveProperty('clearOutput');
    });

    it('runCode should accept optional input parameter', async () => {
      const { result } = renderHook(() => usePyodide());
      
      await act(async () => {
        await result.current.runCode('x = input()', 'test input');
      });
    });

    it('runCode should accept optional fileAssets parameter', async () => {
      const { result } = renderHook(() => usePyodide());
      
      await act(async () => {
        await result.current.runCode('open("test.txt")', '', { 'test.txt': 'content' });
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount (mounted flag)', async () => {
      const mockPyodide = createMockPyodide();
      (window as any).loadPyodide = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => resolve(mockPyodide), 100));
      });
      
      const { unmount } = renderHook(() => usePyodide());
      
      // Unmount before loadPyodide resolves
      unmount();
      
      // Wait for the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // This should not throw - the mounted flag should prevent state updates
    });
  });
});
