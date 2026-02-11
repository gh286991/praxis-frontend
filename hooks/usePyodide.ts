import { useState, useEffect, useCallback, useRef } from 'react';

export interface UsePyodideReturn {
  runCode: (code: string, input?: string, fileAssets?: Record<string, string>) => Promise<{ output: string; error: string | null }>;
  isLoading: boolean;
  output: string[];
  clearOutput: () => void;
  terminate: () => void;
}

export function usePyodide(): UsePyodideReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [output, setOutput] = useState<string[]>([]);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker
  useEffect(() => {
    // Create worker
    const worker = new Worker('/pyodide.worker.js');
    workerRef.current = worker;

    worker.onmessage = (event) => {
        const { type } = event.data;
        if (type === 'loaded') {
            setIsLoading(false);
        }
    };
    
    // Trigger load
    worker.postMessage({ type: 'load' });

    return () => {
      worker.terminate();
    };
  }, []);

  const clearOutput = useCallback(() => setOutput([]), []);

  const terminate = useCallback(() => {
    if (workerRef.current) {
        workerRef.current.terminate();
        // Re-initialize worker
        const worker = new Worker('/pyodide.worker.js');
        workerRef.current = worker;
        
        worker.onmessage = (event) => {
             const { type } = event.data;
            if (type === 'loaded') {
                setIsLoading(false);
            }
        };

        // Trigger load
        worker.postMessage({ type: 'load' });
        setIsLoading(true); 
    }
  }, []);

  const runCode = useCallback(async (code: string, input: string = '', fileAssets?: Record<string, string>) => {
    if (!workerRef.current) {
       return { output: '', error: 'Worker not initialized' };
    }

    setOutput([]);
    const capturedOutput: string[] = [];
    
    return new Promise<{ output: string; error: string | null }>((resolve) => {
        if (!workerRef.current) {
             resolve({ output: '', error: 'Worker failed' });
             return;
        }

        // Unique ID for this run
        const runId = Date.now().toString();

        const handleMessage = (event: MessageEvent) => {
            const { type, content, id } = event.data;
            
            // Only handle messages for this run or global messages?
            // Since we override onmessage, we handle everything.
            if (id && id !== runId) return; 

            if (type === 'output') {
                capturedOutput.push(content);
                setOutput(prev => [...prev, content]);
            } else if (type === 'error') {
                 // Format error
                 const errorMsg = `Error: ${content}`;
                 capturedOutput.push(errorMsg);
                 setOutput(prev => [...prev, errorMsg]);
            } else if (type === 'done') {
                // Restore loading listener or keep?
                // For simplicity, we keep this listener active until next run replacing it.
                resolve({ output: capturedOutput.join('\n'), error: null });
            }
        };

        workerRef.current.onmessage = handleMessage;

        workerRef.current.postMessage({ 
            type: 'runCode', 
            code, 
            input, 
            fileAssets,
            id: runId
        });
    });
  }, []);

  return { runCode, isLoading, output, clearOutput, terminate };
}
