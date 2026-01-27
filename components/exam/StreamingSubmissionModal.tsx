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
  initialTestCases?: { input: string; output: string }[];
}

export function StreamingSubmissionModal({ 
  isOpen, 
  isLoading,
  messages,
  submissionResult,
  onClose,
  onNextChallenge,
  initialTestCases = []
}: StreamingSubmissionModalProps) {
  const [testCases, setTestCases] = useState<TestCaseStatus[]>([]);
  const [processedMessageCount, setProcessedMessageCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Queue for sequential updates
  const updateQueue = useRef<{
    type: 'status_change', 
    index: number, 
    status: 'running' | 'passed' | 'failed',
    data?: any // For passed/failed result details
  }[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize test cases when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTestCases && initialTestCases.length > 0) {
        // Initialize with REAL test cases
        setTestCases(initialTestCases.map((tc, idx) => ({
          index: idx,
          status: 'pending',
          input: tc.input,
          expected: tc.output
        })));
      } else if (testCases.length === 0) {
        // Fallback placeholders if no initial data
        setTestCases([
          { index: 0, status: 'pending' },
          { index: 1, status: 'pending' },
        ]);
      }
      setProcessedMessageCount(0);
      updateQueue.current = [];
      setIsAnimating(true);
    }
  }, [isOpen, initialTestCases]);

  // Parse new messages and push to Queue
  useEffect(() => {
    if (!isOpen) return;

    const newMessages = messages.slice(processedMessageCount);
    if (newMessages.length === 0) return;

    newMessages.forEach(msg => {
      // 1. Completion: "[Test #1] PASSED"
      const testCompleteMatch = msg.match(/\[Test #(\d+)\] (PASSED|FAILED)/);
      if (testCompleteMatch) {
        const testNum = parseInt(testCompleteMatch[1]) - 1;
        const status = testCompleteMatch[2] === 'PASSED' ? 'passed' : 'failed';
        
        // Find detailed result if available in submissionResult (only if submissionResult arrived)
        // But submissionResult might arrive later. 
        // We can just rely on the status for now, and fill details later?
        // Actually, if we want detailed output ("Actual: ..."), we rely on submissionResult mainly.
        // But for visual sequencing, let's at least flip the status.
        updateQueue.current.push({ type: 'status_change', index: testNum, status });
      }
      
      // 2. Running: "Test Case 1 Running"
      if (msg.includes('Test Case') && msg.includes('Running')) {
        const match = msg.match(/Test Case (\d+)/);
        if (match) {
          const testNum = parseInt(match[1]) - 1;
          updateQueue.current.push({ type: 'status_change', index: testNum, status: 'running' });
        }
      }
    });

    setProcessedMessageCount(messages.length);
  }, [messages, isOpen, processedMessageCount]);

  // Consumer Loop (The Animation Heartbeat)
  useEffect(() => {
    if (!isOpen || !isAnimating) return;

    const interval = setInterval(() => {
      if (updateQueue.current.length > 0) {
        // Process ONE event per tick
        const action = updateQueue.current.shift();
        if (action) {
            setTestCases(prev => prev.map((tc, idx) => {
                if (idx === action.index) {
                    return { ...tc, status: action.status };
                }
                return tc;
            }));
        }
      } else if (submissionResult && !isLoading) {
          // If queue is empty AND we have final result, ensure consistency
          // This "snaps" to final state to ensure we show actual outputs/errors 
          // that might not be in the parsed text messages.
          // But we check if we should stop optimizing?
          // Let's perform a sync ONLY if visible states don't match result.
          // Actually, let's just sync the details (actual output, error) but preserve animation flow?
          // No, simpler: once queue empty, we can stop "animating" mode and just show full data?
          // But user wants to see "one by one".
          
          // Let's just create actions for missing data?
          // If submissionResult is ready, we can check if any cases correspond to it.
          // We'll leave this 'sync' logic for the separate effect below that might fill details.
      }
    }, 600); // 600ms per step - gives the "one by one" feel

    return () => clearInterval(interval);
  }, [isOpen, isAnimating, submissionResult, isLoading]);

  // Sync Final Details (Outputs/Errors) - but respect animation timing?
  // Problem: If I sync details immediately, status flips immediately.
  // Solution: I'll ONLY update "details" (actual/error) here, not status, 
  // OR I rely on the queue to set status.
  // But wait, the queue comes from `messages`. `messages` are text. They don't have "Actual output content".
  // "Actual output content" comes from `submissionResult` or `test_case_completed` event data (if I parsed it in hook).
  // My hook *does* parse `test_case_completed` event object! 
  // Line 105 in `useRemoteExecution`: `const { testIndex, testCase } = event.data || {};`
  // But strictly `systemMessages` only gets the text string `[Test #N] PASSED`.
  // The HOOK needs to expose the event data if I want rich data in the queue.
  // OR, I can use `submissionResult` to simple fill in the blanks at the end.
  
  // Compromise:
  // 1. Queue handles Status (Running -> Passed/Failed).
  // 2. This effect passively fills in "Actual Output/Error" text when it becomes available, 
  //    but doesn't change status if it's 'pending'.
  useEffect(() => {
    if (submissionResult?.testResult?.results) {
       setTestCases(prev => prev.map((tc, idx) => {
           const res = submissionResult.testResult.results[idx];
           if (!res) return tc;
           // Only update details, don't jump ahead of animation status
           // Unless animation is done/stuck?
           // Actually, if we just update `actual` and `error` fields, they won't show until status is non-pending.
           return {
               ...tc,
               input: res.input || tc.input,
               expected: res.expected || tc.expected,
               actual: res.actual,
               error: res.error
           };
       }));
    }
  }, [submissionResult]);
  
  // Auto-terminate animation when all done
  useEffect(() => {
     if (submissionResult && !isLoading && updateQueue.current.length === 0) {
         // Maybe wait a bit then setIsAnimating(false)?
     }
  }, [submissionResult, isLoading]);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll to active test case
  useEffect(() => {
    // Find the first running or the last updated element?
    // We want to follow "where it runs".
    // Priority: running > first pending > last passed/failed (if all done)
    
    // Actually, simply scrolling to the "currently running" one is best.
    const runningIndex = testCases.findIndex(tc => tc.status === 'running');
    
    if (runningIndex !== -1 && itemRefs.current[runningIndex]) {
        itemRefs.current[runningIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // If none running (e.g. just finished one, or all done), maybe scroll to the last processed one?
        // If we just finished #2, next is #3 (pending).
        // Let's scroll to the first 'pending' one if exists, effectively showing progress.
        const firstPendingIndex = testCases.findIndex(tc => tc.status === 'pending');
        if (firstPendingIndex !== -1 && itemRefs.current[firstPendingIndex]) {
             // Don't scroll too aggressively for pending, maybe just ensure it's visible?
             // Actually, let's stick to "Running" or the one just finished.
             // If we scroll to running, it follows the cursor.
             // If transition from Running #1 -> Passed #1 -> Running #2
             // The interval updates status.
        }
    }
  }, [testCases]);

  if (!isOpen) return null;

  // Only show "CHALLENGE COMPLETED" when queue is empty AND backend is done.
  const isVisualComplete = !isLoading && updateQueue.current.length === 0;
  // If we assume `submissionResult` implies done.
  const isCorrect = submissionResult?.isCorrect || false;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-slate-700/50 rounded-lg shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            {isVisualComplete && submissionResult ? (
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
            disabled={!isVisualComplete}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              Test Case Execution
            </h3>
            <div className="space-y-3">
              {testCases.map((testCase, idx) => (
                <div 
                  key={testCase.index} 
                  ref={el => { itemRefs.current[idx] = el }}
                  className={`bg-slate-950 border rounded-lg overflow-hidden transition-all duration-300 ${
                    testCase.status === 'running' ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20 scale-[1.01]' :
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

                  {/* Test Case Details */}
                  {/* Visible during running (optional) or completed */}
                  {/* User wants to see "real code" from start. So we show Input always if available */}
                  <div className={`p-4 grid grid-cols-2 gap-4 text-xs font-mono transition-all duration-500 ${
                    testCase.status === 'pending' ? 'opacity-50 grayscale' : 'opacity-100 grayscale-0'
                  }`}>
                      <div>
                        <div className="text-slate-500 mb-1">Input:</div>
                        <div className="bg-slate-900 p-2 rounded text-slate-300 border border-slate-800/50 overflow-x-auto whitespace-pre max-h-24 custom-scrollbar">
                          {testCase.input || <span className="text-slate-600 italic">No input</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Expected:</div>
                        <div className="bg-slate-900 p-2 rounded text-slate-300 border border-slate-800/50 overflow-x-auto whitespace-pre max-h-24 custom-scrollbar">
                           {testCase.expected || <span className="text-slate-600 italic">Hidden</span>}
                        </div>
                      </div>
                      
                      {/* Actual Output / Error - Only when failed or passed */}
                      {(testCase.status === 'failed' || testCase.status === 'passed') && (
                        <div className="col-span-2 animate-in fade-in duration-300">
                             <div className={`${testCase.status === 'failed' ? 'text-rose-400/80' : 'text-emerald-400/80'} mb-1`}>
                                Actual Output:
                             </div>
                             <div className={`p-2 rounded border overflow-x-auto whitespace-pre ${
                                 testCase.status === 'failed' 
                                 ? 'bg-rose-950/10 text-rose-300 border-rose-500/20' 
                                 : 'bg-emerald-950/10 text-emerald-300 border-emerald-500/20'
                             }`}>
                                {testCase.error ? `Error: ${testCase.error}` : testCase.actual || <span className="italic opacity-50">Empty output</span>}
                             </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Footer */}
        {isVisualComplete && (
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

