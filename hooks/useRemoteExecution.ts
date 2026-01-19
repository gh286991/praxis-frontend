
import { useState } from 'react';

interface UseRemoteExecutionReturn {
  runCodeWithStream: (code: string, input?: string) => Promise<{ output: string; error: string | null }>;
  submitCodeWithStream: (code: string, questionId: string) => Promise<{ output: string; error: string | null; passed?: boolean; results?: any[] }>;
  output: string[];
  isLoading: boolean;
  clearOutput: () => void;
}

export function useRemoteExecution(): UseRemoteExecutionReturn {
  const [output, setOutput] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const clearOutput = () => setOutput([]);

  const runCodeWithStream = async (code: string, input: string = ''): Promise<{ output: string; error: string | null }> => {
    return _streamFetch('/execution/stream', { code, input });
  };

  const submitCodeWithStream = async (code: string, questionId: string): Promise<{ output: string; error: string | null; passed?: boolean; results?: any[] }> => {
      // For submission, we might receive special events like 'test_case_result' if we designed it that way,
      // but currently backend executePiston logic emits 'processing' and 'completed'.
      // 'completed' data for evaluate contains { passed, results }.
      return _streamFetch('/execution/submit-stream', { code, questionId });
  }

  const _streamFetch = async (endpoint: string, body: any): Promise<any> => {
    setIsLoading(true);
    setOutput([]); 
    
    let finalOutput = '';
    let finalError: string | null = null;
    let finalData: any = null;
    
    try {
        const token = localStorage.getItem('jwt_token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error (${response.status}): ${errorText}`);
        }

        if (!response.body) {
            throw new Error('ReadableStream not supported by browser');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            console.log('[SSE] Raw Chunk:', chunk); // DEBUG
            buffer += chunk;
            
            const lines = buffer.split('\n\n');
            console.log('[SSE] Splitted Lines:', lines.length, lines); // DEBUG
            buffer = lines.pop() || ''; 
            
            for (const line of lines) {
                // console.log('RAW LINE:', line); // Very verbose
                const dataPrefix = 'data: ';
                const linesInBlock = line.split('\n');
                for (const innerLine of linesInBlock) {
                    if (innerLine.startsWith(dataPrefix)) {
                        try {
                            const jsonStr = innerLine.slice(dataPrefix.length);
                            const event = JSON.parse(jsonStr);
                            console.log('[SSE] Event:', event); // DEBUG LOG
                            
                            // Handle Event
                            if (event.status === 'queued') {
                                setOutput(prev => [...prev, `[System] ${event.message || 'Queued...'}...`]);
                            } else if (event.status === 'processing') {
                                setOutput(prev => [...prev, `[System] ${event.message || 'Processing...'}...`]);
                            } else if (event.status === 'completed') {
                                if (event.data && event.data.output) {
                                  // Simple execution output
                                    const outLines = event.data.output.split('\n');
                                    setOutput(prev => [...prev, ...outLines]);
                                    finalOutput = event.data.output;
                                }
                                if (event.data && event.data.results) {
                                    // Submission results
                                    finalData = { 
                                        passed: event.data.passed, 
                                        results: event.data.results 
                                    };
                                    setOutput(prev => [...prev, `[System] Analysis Complete. Passed: ${event.data.passed}`]);
                                }
                                if (event.data && event.data.error) {
                                    setOutput(prev => [...prev, `Error: ${event.data.error}`]);
                                    finalError = event.data.error;
                                }
                            } else if (event.status === 'error') {
                                setOutput(prev => [...prev, `System Error: ${event.message}`]);
                                finalError = event.message;
                            }
                        } catch (e) {
                            console.error('Failed to parse SSE JSON', e);
                        }
                    }
                }
            }
        }
    } catch (err: any) {
        console.error('Stream Error', err);
        setOutput(prev => [...prev, `Connection Error: ${err.message}`]);
        finalError = err.message;
    } finally {
        setIsLoading(false);
    }
    
    return { output: finalOutput, error: finalError, ...finalData };
  };

  return { runCodeWithStream, submitCodeWithStream, output, isLoading, clearOutput };
}
