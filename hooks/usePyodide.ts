import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    loadPyodide: any;
    pyodide: any;
  }
}

interface UsePyodideReturn {
  runCode: (code: string, input?: string) => Promise<{ output: string; error: string | null }>;
  isLoading: boolean;
  output: string[];
  clearOutput: () => void;
}

export function usePyodide(): UsePyodideReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [output, setOutput] = useState<string[]>([]);
  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadPyodide = async () => {
      try {
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.async = true;
          
          script.onload = async () => {
            if (!mounted) return;
            try {
              const pyodide = await window.loadPyodide({
                  indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
              });
              if (mounted) {
                pyodideRef.current = pyodide;
              }
            } catch (err) {
              console.error('Failed to initialize Pyodide:', err);
            } finally {
              if (mounted) setIsLoading(false);
            }
          };

          script.onerror = (err) => {
              console.error('Failed to load Pyodide script from CDN', err);
              if (mounted) setIsLoading(false);
          };

          document.body.appendChild(script);
        } else if (!pyodideRef.current) {
            // Window has loadPyodide but ref is null (re-mount)
            try {
                const pyodide = await window.loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
                });
                if (mounted) {
                    pyodideRef.current = pyodide;
                }
            } catch (err) {
                console.error('Failed to re-initialize Pyodide:', err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        } else {
            // Already initialized
            setIsLoading(false);
        }
      } catch (e) {
        console.error('Error in loadPyodide content', e);
        if (mounted) setIsLoading(false);
      }
    };

    loadPyodide();

    return () => {
      mounted = false;
    };
  }, []);

  const clearOutput = useCallback(() => setOutput([]), []);

  const runCode = useCallback(async (code: string, input: string = '') => {
    if (!pyodideRef.current) {
      return { output: '', error: 'Pyodide is not loaded yet' };
    }

    // Reset output specific to this run can be handled by caller, but we append here generally.
    // However, for "Run", we typically want to clear previous output or invalid commands?
    // Let's clear for fresh run
    setOutput([]); 

    try {
      // Setup stdin/stdout
      pyodideRef.current.setStdout({ batched: (msg: string) => setOutput((prev) => [...prev, msg]) });
      pyodideRef.current.setStderr({ batched: (msg: string) => setOutput((prev) => [...prev, `Error: ${msg}`]) });
      
      // Mock input() if needed
      // Simple input support via prompt or pre-fed input? 
      // User passed `input` arg.
      // We can patch `input()` function in Python.
      if (input) {
          // A bit hacky: override input
          // Better: use pyodide.setStdin if available or custom function
          const stdinIterator = (function* () {
             const lines = input.split('\n');
             for(let line of lines) yield line;
          })();
          pyodideRef.current.setStdin({ stdin: () => stdinIterator.next().value });
      }

      await pyodideRef.current.runPythonAsync(code);
      return { output: '', error: null }; // Output captured via callbacks
    } catch (err: any) {
      const errorMsg = err.toString();
      setOutput((prev) => [...prev, errorMsg]);
      return { output: '', error: errorMsg };
    }
  }, []);

  return { runCode, isLoading, output, clearOutput };
}
