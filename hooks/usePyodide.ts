import { useState, useEffect } from 'react';

// Define Pyodide types broadly to avoid strict TS issues before types are loaded
declare global {
  interface Window {
    loadPyodide: (config: any) => Promise<any>;
  }
}

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<string>;
  loadPackage: (packages: string[]) => Promise<void>;
  setStdout: (options: { batched: (msg: string) => void }) => void;
  setStderr: (options: { batched: (msg: string) => void }) => void;
}

export function usePyodide() {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initPyodide() {
      try {
        // Load Pyodide script
        if (!window.loadPyodide) {
           const script = document.createElement('script');
           script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
           script.async = true;
           document.body.appendChild(script);
           await new Promise((resolve) => {
             script.onload = resolve;
           });
        }

        if (!mounted) return;

        const pyodideInstance = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
        });

        // Redirect stdout/stderr
        pyodideInstance.setStdout({
          batched: (msg: string) => {
             setOutput((prev) => [...prev, msg]);
          }
        });
        
        pyodideInstance.setStderr({
            batched: (msg: string) => {
               // We might treat stderr as output or separate error
               // For Python prints, they go to stdout. Errors go to stderr.
               setOutput((prev) => [...prev, `Error: ${msg}`]);
            }
        });

        // Load common packages (optional, can be lazy loaded)
        // await pyodideInstance.loadPackage(['numpy']); // Example

        setPyodide(pyodideInstance);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load Pyodide", err);
        setError("Failed to load Python runtime.");
        setIsLoading(false);
      }
    }

    initPyodide();

    return () => {
      mounted = false;
    };
  }, []);

  const runCode = async (code: string, input: string = '') => {
    if (!pyodide) return;
    setOutput([]); // Clear previous output
    setError(null);

    try {
      // Mock stdin if input is provided
      if (input) {
          // Escape newlines and quotes properly for the python string
          const safeInput = JSON.stringify(input); 
          await pyodide.runPythonAsync(`
import sys
import io
sys.stdin = io.StringIO(${safeInput})
          `);
      }
      
      await pyodide.runPythonAsync(code);
    } catch (err: any) {
       setError(err.message);
       // Check if it's a syntax error or runtime error to format nicely
       setOutput((prev) => [...prev, `Runtime Error: ${err.message}`]);
    }
  };

  const runCodeWithOutput = async (code: string, input: string = ''): Promise<{ output: string; error: string | null }> => {
    if (!pyodide) return { output: '', error: 'Pyodide not loaded' };

    const localOutput: string[] = [];
    let localError: string | null = null;

    // Override handlers
    pyodide.setStdout({
      batched: (msg: string) => localOutput.push(msg),
    });
    pyodide.setStderr({
      batched: (msg: string) => {
        localOutput.push(`Error: ${msg}`);
        localError = msg;
      },
    });

    try {
      if (input) {
        const safeInput = JSON.stringify(input);
        await pyodide.runPythonAsync(`
import sys
import io
sys.stdin = io.StringIO(${safeInput})
        `);
      }
      await pyodide.runPythonAsync(code);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      localError = errorMessage;
      localOutput.push(`Runtime Error: ${errorMessage}`);
    } finally {
      // Restore default handlers to update React state
      pyodide.setStdout({
        batched: (msg: string) => setOutput((prev) => [...prev, msg]),
      });
      pyodide.setStderr({
        batched: (msg: string) => setOutput((prev) => [...prev, `Error: ${msg}`]),
      });
    }

    return { output: localOutput.join('\n'), error: localError };
  };

  const clearOutput = () => {
      setOutput([]);
      setError(null);
  }

  return { pyodide, isLoading, output, error, runCode, runCodeWithOutput, clearOutput };
}
