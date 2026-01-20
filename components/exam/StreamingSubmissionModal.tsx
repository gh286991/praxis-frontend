'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock, Code2, SkipForward, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TestCaseStatus {
  index: number;
  status: 'pending' | 'running' | 'passed' | 'failed';
  input?: string;
  expected?: string;
  actual?: string;
  error?: string;
}

interface StreamingSubmissionModalProps {
  isOpen: boolean;
  isLoading: boolean;
  messages: string[];
  submissionResult: any | null;
  onClose: () => void;
  onNextChallenge?: () => void;
}

export function StreamingSubmissionModal({ 
  isOpen, 
  isLoading,
  messages,
  submissionResult,
  onClose,
  onNextChallenge
}: StreamingSubmissionModalProps) {
  const [testCases, setTestCases] = useState<TestCaseStatus[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize test cases when modal opens
  useEffect(() => {
    if (isOpen && isLoading && testCases.length === 0) {
      // Initialize with placeholder test cases
      setTestCases([
        { index: 0, status: 'pending' },
        { index: 1, status: 'pending' },
      ]);
    }
  }, [isOpen, isLoading, testCases.length]);

  // Update test cases based on submission result
  useEffect(() => {
    if (submissionResult?.testResult?.results) {
      const results = submissionResult.testResult.results;
      setTestCases(results.map((result: any, index: number) => ({
        index,
        status: result.passed ? 'passed' : 'failed',
        input: result.input,
        expected: result.expected,
        actual: result.actual,
        error: result.error,
      })));
    }
  }, [submissionResult]);

  // Simulate streaming progress (update based on messages)
  useEffect(() => {
    messages.forEach(msg => {
      // Parse test case completed messages: "[Test #1] PASSED" or "[Test #1] FAILED"
      const testCompleteMatch = msg.match(/\[Test #(\d+)\] (PASSED|FAILED)/);
      if (testCompleteMatch) {
        const testNum = parseInt(testCompleteMatch[1]) - 1;
        const status = testCompleteMatch[2] === 'PASSED' ? 'passed' : 'failed';
        setTestCases(prev => prev.map((tc, idx) => 
          idx === testNum ? { ...tc, status: status as 'passed' | 'failed' } : tc
        ));
      }
      
      //  Also handle processing messages to mark as running
      if (msg.includes('Test Case') && msg.includes('Running')) {
        const match = msg.match(/Test Case (\d+)/);
        if (match) {
          const testNum = parseInt(match[1]) - 1;
          setTestCases(prev => prev.map((tc, idx) => 
            idx === testNum ? { ...tc, status: 'running' as const } : tc
          ));
        }
      }
    });
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [testCases]);

  if (!isOpen) return null;

  const allComplete = submissionResult && !isLoading;
  const isCorrect = submissionResult?.isCorrect || false;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-slate-700/50 rounded-lg shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            {allComplete ? (
              <>
                {isCorrect ? (
                  <div className="p-2 bg-emerald-500/10 rounded-full">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                ) : (
                  <div className="p-2 bg-rose-500/10 rounded-full">
                    <XCircle className="w-6 h-6 text-rose-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {isCorrect ? 'CHALLENGE COMPLETED' : 'SUBMISSION FAILED'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                    Evaluation Report
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-indigo-500/20 rounded-full">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Evaluating Submission
                  </h2>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                    Running test cases...
                  </p>
                </div>
              </>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white hover:bg-slate-800 p-2 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* AI Feedback Section (shown after completion) */}


          {/* Test Cases Section */}
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              Test Case Execution
            </h3>
            <div className="space-y-3">
              {testCases.map((testCase) => (
                <div 
                  key={testCase.index} 
                  className={`bg-slate-950 border rounded-lg overflow-hidden transition-all duration-300 ${
                    testCase.status === 'running' ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20' :
                    testCase.status === 'passed' ? 'border-emerald-500/30' :
                    testCase.status === 'failed' ? 'border-rose-500/30' :
                    'border-slate-800'
                  }`}
                >
                  {/* Test Case Header */}
                  <div className={`px-4 py-2 flex items-center justify-between border-b border-slate-800 ${
                    testCase.status === 'running' ? 'bg-indigo-500/10' :
                    testCase.status === 'passed' ? 'bg-emerald-500/5' :
                    testCase.status === 'failed' ? 'bg-rose-500/5' :
                    'bg-slate-900/50'
                  }`}>
                    <span className="font-mono text-xs text-slate-400 uppercase">
                      Test Case #{testCase.index + 1}
                    </span>
                    
                    {/* Status Indicator */}
                    {testCase.status === 'pending' && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
                        <Clock className="w-3 h-3" /> PENDING
                      </span>
                    )}
                    {testCase.status === 'running' && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> RUNNING...
                      </span>
                    )}
                    {testCase.status === 'passed' && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> PASS
                      </span>
                    )}
                    {testCase.status === 'failed' && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        <XCircle className="w-3 h-3" /> FAIL
                      </span>
                    )}
                  </div>

                  {/* Test Case Details (shown when completed) */}
                  {(testCase.status === 'passed' || testCase.status === 'failed') && (
                    <div className="p-4 grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <div className="text-slate-500 mb-1">Input:</div>
                        <div className="bg-slate-900 p-2 rounded text-slate-300 border border-slate-800/50 overflow-x-auto whitespace-pre-wrap">
                          {testCase.input || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Expected:</div>
                        <div className="bg-slate-900 p-2 rounded text-slate-300 border border-slate-800/50 overflow-x-auto whitespace-pre-wrap">
                          {testCase.expected || 'N/A'}
                        </div>
                      </div>
                      {testCase.status === 'failed' && (
                        <div className="col-span-2">
                          <div className="text-rose-400/80 mb-1">Actual Output:</div>
                          <div className="bg-rose-950/10 p-2 rounded text-rose-300 border border-rose-500/20 overflow-x-auto whitespace-pre-wrap">
                            {testCase.error ? `Error: ${testCase.error}` : testCase.actual || 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Running placeholder */}
                  {testCase.status === 'running' && (
                    <div className="p-6 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-mono">Executing test case...</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Footer */}
        {allComplete && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              Close Report
            </Button>
            {isCorrect && onNextChallenge && (
              <Button 
                onClick={onNextChallenge}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Next Challenge <SkipForward className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

