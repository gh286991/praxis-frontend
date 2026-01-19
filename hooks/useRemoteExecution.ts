
import { useState } from 'react';

interface UseRemoteExecutionReturn {
  runCodeWithStream: (code: string, input?: string) => Promise<{ output: string; error: string | null }>;
  submitCodeWithStream: (code: string, questionId: string) => Promise<{ output: string; error: string | null; passed?: boolean; results?: any[] }>;
  systemMessages: string[];      // For Modal display
  executionOutput: string[];     // For Console display
  isLoading: boolean;
  clearMessages: () => void;
}

export function useRemoteExecution(): UseRemoteExecutionReturn {
  const [systemMessages, setSystemMessages] = useState<string[]>([]);
  const [executionOutput, setExecutionOutput] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const clearMessages = () => {
    setSystemMessages([]);
    setExecutionOutput([]);
  };

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
    clearMessages(); // Clear previous messages
    
    let finalOutput = '';
    let finalError: string | null = null;
    let finalData: any = null;
    
    // Determine if this is a submission request
    const isSubmission = endpoint.includes('submit');
    
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
                const dataPrefix = 'data: ';
                const linesInBlock = line.split('\n');
                for (const innerLine of linesInBlock) {
                    if (innerLine.startsWith(dataPrefix)) {
                        try {
                            const jsonStr = innerLine.slice(dataPrefix.length);
                            const event = JSON.parse(jsonStr);
                            console.log('[SSE] Event:', event); // DEBUG LOG
                            
                            // Handle Event - Separate System Messages from Execution Output
                            if (event.status === 'queued') {
                                const msg = event.message || 'Queued...';
                                setSystemMessages(prev => [...prev, `[System] ${msg}`]);
                            } else if (event.status === 'processing') {
                                const msg = event.message || 'Processing...';
                                setSystemMessages(prev => [...prev, `[System] ${msg}`]);
                            } else if (event.status === 'test_case_completed') {
                                // 🔥 Individual test case completed - notify frontend
                                const { testIndex, testCase } = event.data || {};
                                if (testIndex !== undefined && testCase) {
                                    setSystemMessages(prev => [...prev, `[Test #${testIndex + 1}] ${testCase.passed ? 'PASSED' : 'FAILED'}`]);
                                }
                            } else if (event.status === 'completed') {
                                if (event.data && event.data.output) {
                                  // For submission: only show in Modal (systemMessages)
                                  // For run: show in Console (executionOutput)
                                    if (!isSubmission) {
                                        const outLines = event.data.output.split('\n');
                                        setExecutionOutput(prev => [...prev, ...outLines]);
                                    }
                                    finalOutput = event.data.output;
                                }
                                if (event.data && event.data.results) {
                                    // Submission results - show completion message in Modal only
                                    finalData = { 
                                        passed: event.data.passed, 
                                        results: event.data.results 
                                    };
                                    setSystemMessages(prev => [...prev, `[System] All tests complete. Overall: ${event.data.passed ? 'PASSED' : 'FAILED'}`]);
                                }
                                if (event.data && event.data.error) {
                                    // Errors always show in Modal
                                    setSystemMessages(prev => [...prev, `[System] Error: ${event.data.error}`]);
                                    // For non-submission errors, also show in Console
                                    if (!isSubmission) {
                                        setExecutionOutput(prev => [...prev, `Error: ${event.data.error}`]);
                                    }
                                    finalError = event.data.error;
                                }
                            } else if (event.status === 'error') {
                                // System errors always show in Modal
                                setSystemMessages(prev => [...prev, `[System] System Error: ${event.message}`]);
                                // For non-submission errors, also show in Console
                                if (!isSubmission) {
                                    setExecutionOutput(prev => [...prev, `System Error: ${event.message}`]);
                                }
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
        const errorMsg = `Connection Error: ${err.message}`;
        // Connection errors always show in Modal
        setSystemMessages(prev => [...prev, `[System] ${errorMsg}`]);
        // For non-submission errors, also show in Console
        if (!isSubmission) {
            setExecutionOutput(prev => [...prev, errorMsg]);
        }
        finalError = err.message;
    } finally {
        setIsLoading(false);
    }
    
    return { output: finalOutput, error: finalError, ...finalData };
  };

  return { 
    runCodeWithStream, 
    submitCodeWithStream, 
    systemMessages, 
    executionOutput, 
    isLoading, 
    clearMessages 
  };
}
