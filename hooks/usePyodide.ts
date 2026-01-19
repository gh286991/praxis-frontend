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

    // Reset output specific to this run
    setOutput([]); 
    const capturedOutput: string[] = [];

    const handleOutput = (msg: string) => {
        capturedOutput.push(msg);
        setOutput((prev) => [...prev, msg]);
    };
    
    const handleError = (msg: string) => {
        const errorMsg = `Error: ${msg}`;
        capturedOutput.push(errorMsg);
        setOutput((prev) => [...prev, errorMsg]);
    };

    try {
      // Setup stdin/stdout
      pyodideRef.current.setStdout({ batched: handleOutput });
      pyodideRef.current.setStderr({ batched: handleError });
      
      // Mock input() if needed
      if (input) {
          const stdinIterator = (function* () {
             const lines = input.split('\n');
             for(let line of lines) yield line;
          })();
          pyodideRef.current.setStdin({ stdin: () => stdinIterator.next().value });
      }

      await pyodideRef.current.runPythonAsync(code);
      return { output: capturedOutput.join('\n'), error: null }; 
    } catch (err: any) {
      const errorMsg = err.toString();
      setOutput((prev) => [...prev, errorMsg]);
      return { output: capturedOutput.join('\n'), error: errorMsg };
    }
  }, []);

  return { runCode, isLoading, output, clearOutput };
}
