'use client';

import { use, useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNextQuestion, submitAnswer, getHint, getHistory, getQuestionById, evaluateSubmission } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setUser, logout } from '@/lib/store/slices/userSlice';
import {
  setCurrentQuestion,
  setHistory,
  setCode,
  setOutput,
  setLoading,
  setExecuting,
  setHint,
  setIsHintOpen,
  setIsCompleted,
  resetQuestion,
  setSubmissionLoading,
  setSubmissionResult,
} from '@/lib/store/slices/questionsSlice';
import { QuestionPanel } from '@/components/exam/QuestionPanel';
import { EditorPanel } from '@/components/exam/EditorPanel';
import { ConsolePanel } from '@/components/exam/ConsolePanel';
import { StreamingSubmissionModal } from '@/components/exam/StreamingSubmissionModal';
import GenerationModal from '@/components/exam/GenerationModal';
import { Loader2, Sparkles, Code2, ArrowLeft, Lightbulb, X, History, CheckCircle2, XCircle, SkipForward, Menu, LogOut, GripVertical, GripHorizontal, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { HistoryItem } from '@/lib/store/slices/questionsSlice';
import { CyberpunkBackground } from '@/components/CyberpunkBackground';
import { usePyodide } from '@/hooks/usePyodide';
import { useRemoteExecution } from '@/hooks/useRemoteExecution';

const examTitles: Record<string, string> = {
  category1: '第1類：基本程式設計',
  category2: '第2類：選擇敘述',
  category3: '第3類：迴圈敘述',
  category4: '第4類：進階控制流程',
  category5: '第5類：函式(Function)',
  category6: '第6類：串列(List)的運作',
  category7: '第7類：數組、集合、字典',
  category8: '第8類：字串(String)的運作',
  category9: '第9類：檔案與異常處理',
};

export default function ExamPage({ params }: { params: Promise<{ subjectSlug: string; categorySlug: string }> }) {
  const { subjectSlug, categorySlug } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Redux state
  const user = useAppSelector((state) => state.user.profile);
  const {
    currentQuestion: question,
    history,
    code,
    output: globalOutput, // Renamed to avoid conflict with local/remote outputs
    loading,
    executing,
    hint,
    isHintOpen,
    isCompleted,
    submissionLoading,
    submissionResult,
  } = useAppSelector((state) => state.questions);

  // Hook 1: Local Pyodide for "Run"
  const { 
      runCode: runLocalCode, 
      output: localOutput, 
      isLoading: isLocalLoading 
  } = usePyodide();

  // Hook 2: Remote Execution for "Submit" (Streaming)
  const { 
      submitCodeWithStream, 
      systemMessages,      // For Modal display
      executionOutput,     // For Console (not used for Submit, only for Run)
      isLoading: isRemoteLoading 
  } = useRemoteExecution();

  // State for Submission Progress Modal
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  // Sync Local Output to Redux Console
  // Only sync LOCAL execution output (Run button), not remote submission
  useEffect(() => {
    if (localOutput.length > 0) {
      dispatch(setOutput(localOutput.join('\n')));
    }
  }, [localOutput, dispatch]);

  const examId = categorySlug;
  
  // UI local state (layout related)
  // ... (unchanged)
  const [leftWidth, setLeftWidth] = useState(480);
  const mainRef = useRef<HTMLDivElement>(null);
  const [consoleHeight, setConsoleHeight] = useState(300);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Hint loading state (UI only)
  const [hintLoading, setHintLoading] = useState(false);

  // Result state
  const [isPassed, setIsPassed] = useState<boolean | undefined>(undefined);
  const [runResults, setRunResults] = useState<{
    input: string;
    output: string;
    expected: string;
    passed: boolean;
  }[]>([]);

  // State for Generation Modal
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'progress' | 'success' | 'error'>('idle');
  const [generationMessages, setGenerationMessages] = useState<string[]>([]);



  const fetchHistoryData = useCallback(async () => {
    try {
      const data = await getHistory(examId);
      dispatch(setHistory(data));
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  }, [examId, dispatch]);

  const handleRun = async () => {
    dispatch(setExecuting(true));
    dispatch(setOutput('Initializing local Python environment...'));
    setIsPassed(undefined); // Reset status
    setRunResults([]); // Reset results

    try {
      // Determine samples to run
      // Prioritize `samples` array, fallback to legacy `sampleInput`/`sampleOutput`
      let samplesToRun = [];
      if (question?.samples && question.samples.length > 0) {
          samplesToRun = question.samples;
      } else if (question?.sampleInput) {
          samplesToRun = [{ input: question.sampleInput, output: question.sampleOutput }];
      } else {
          // No samples available, just run once with empty input
          samplesToRun = [{ input: '', output: '' }];
      }
      
      const results = [];
      
      for (const sample of samplesToRun) {
          // Parse sample input for file content (format: "filename: content")
          let currentInput = sample.input || '';
          const currentFileAssets = { ...(question?.fileAssets || {}) };
          
          // Check if input follows "filename: content" pattern for file I/O
          if (question?.fileAssets) {
            for (const fileName of Object.keys(question.fileAssets)) {
              if (currentInput.startsWith(fileName + ':')) {
                const fileContent = currentInput.substring(fileName.length + 1);
                currentFileAssets[fileName] = fileContent;
                currentInput = ''; // Clear stdin since it's file content, not stdin input
                break;
              }
            }
          }
          
          // Use Local Pyodide with dynamically updated fileAssets
          const { output: actualOutput, error } = await runLocalCode(code, currentInput, currentFileAssets);
          
          // Pass/Fail Logic
          let passed = false;
          // If sample has output to compare
          if (sample.output) {
              const actualTrimmed = actualOutput.trim();
              const expectedTrimmed = sample.output.trim();
              passed = !error && actualTrimmed === expectedTrimmed;
          } else {
              // If no expected output, usually just run? 
              // But for TQC, usually there is expected output. 
              // If not, we can assume passed if no error?
              passed = !error;
          }
          
          results.push({
              input: sample.input || '',
              output: error ? `Error: ${error}` : actualOutput,
              expected: sample.output || '',
              passed
          });
      }
      
      setRunResults(results);
      
      // If we have valid checks, set global passed status
      if (results.some(r => r.expected)) {
          setIsPassed(results.every(r => r.passed));
      }

    } catch (e) {
      console.error(e);
      dispatch(setOutput('Execution failed due to an error.'));
    } finally {
      dispatch(setExecuting(false));
    }
  };

  // ...

            <ConsolePanel 
              output={globalOutput} 
              height={consoleHeight} 
              input={question?.sampleInput}
              expectedOutput={question?.sampleOutput}
              passed={isPassed}
            />

  // Auth and User Profile
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Only fetch if not already loaded (or could verify token validity)
    // For now, simple fetch content
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then((data) => {
        dispatch(setUser(data));
        fetchHistoryData();
      })
      .catch(() => {
        localStorage.removeItem('jwt_token');
        dispatch(logout());
        router.push('/login');
      });
      
    // Cleanup on unmount
    return () => {
       dispatch(resetQuestion());
    };
  }, [router, dispatch, fetchHistoryData]);

  // Layout resizing logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate available width from container if possible
      const maxLeftWidth = mainRef.current 
        ? mainRef.current.offsetWidth - 500 
        : window.innerWidth - 500;

      if (isDraggingLeft) {
        const newWidth = e.clientX;
        
        // Strict clamp
        const clampedWidth = Math.min(Math.max(newWidth, 300), Math.max(300, maxLeftWidth));
        setLeftWidth(clampedWidth);
      }
      
      if (isDraggingConsole) {
        const newHeight = window.innerHeight - e.clientY;
        const maxConsoleHeight = window.innerHeight - 200; 
        if (newHeight >= 100 && newHeight <= maxConsoleHeight) {
            setConsoleHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingConsole(false);
    };

    if (isDraggingLeft || isDraggingConsole) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isDraggingLeft ? 'col-resize' : 'row-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDraggingLeft, isDraggingConsole]);

  const handleGenerate = async () => {
    dispatch(setLoading(true));
    setIsGenerationModalOpen(true);
    setGenerationStatus('progress');
    setGenerationMessages(['Starting question generation...']);

    try {
      const token = localStorage.getItem('jwt_token');
      // Force generation to skip database check if desired, or if we want streaming we always force? 
      // The previous code passed `true` (force). Streaming endpoint supports force param.
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/questions/stream?category=${examId}&force=true`, {
          headers: {
              Authorization: `Bearer ${token}`
          }
      });

      if (!response.ok) {
           const errText = await response.text();
           throw new Error(`Failed to connect: ${response.status} ${errText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
              if (line.trim() === '') continue;
              if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6);
                  try {
                      const payload = JSON.parse(dataStr);
                      // payload is { status: 'progress' | 'success' | 'error', message: string, data?: any }
                      
                      if (payload.status === 'progress') {
                          setGenerationMessages(prev => [...prev, payload.message]);
                      } else if (payload.status === 'success') {
                           setGenerationStatus('success');
                           setGenerationMessages(prev => [...prev, payload.message]);
                           
                           // Delay closing slightly to show success
                           setTimeout(() => {
                               dispatch(setCurrentQuestion(payload.data));
                               dispatch(setCode('# write your code here\nprint("Hello World")'));
                               dispatch(setOutput(''));
                               dispatch(setHint(null));
                               dispatch(setIsHintOpen(false));
                               dispatch(setIsCompleted(false));
                               setRunResults([]);
                               setIsPassed(undefined);
                               fetchHistoryData();
                               
                               setIsGenerationModalOpen(false);
                           }, 1500);
                           return; // Exit loop and function
                      } else if (payload.status === 'error') {
                          setGenerationStatus('error');
                          setGenerationMessages(prev => [...prev, payload.message]);
                          // Keep modal open so user sees error
                          return;
                      }
                  } catch (e) {
                      console.error('Parse error', e);
                  }
              }
          }
      }
      
    } catch (e: any) {
      console.error(e);
      setGenerationStatus('error');
      setGenerationMessages(prev => [...prev, `Error: ${e.message}`]);
    } finally {
      dispatch(setLoading(false));
    }
  };
  
  const handleSkip = async () => {
      await handleGenerate();
  };

  const handleLoadHistoryQuestion = async (item: HistoryItem) => {
      dispatch(setLoading(true));
      try {
          const q = await getQuestionById(item.questionId);
          dispatch(setCurrentQuestion(q));
          dispatch(setCode(item.code || '# write your code here\nprint("Hello World")'));
          dispatch(setOutput(''));
          dispatch(setHint(null));
          dispatch(setIsHintOpen(false));
          setIsSidebarOpen(false);
          dispatch(setIsCompleted(true));
          setRunResults([]);
          setIsPassed(item.isCorrect); // Restore passed status from history if available? actually history doesn't store runs details usually, just final result.
          // But if we load history, we typically don't have the "runs" that led to it unless we store them. 
          // For now, clear them so user can run again.
          setIsPassed(undefined);
      } catch (e) {
          console.error(e);
          alert('Failed to load question');
      } finally {
          dispatch(setLoading(false));
      }
  };
  
  const handleGetHint = async () => {
    if (!question) return;
    
    setHintLoading(true);
    try {
      const res = await getHint(question._id, code);
      if (res.hint) {
        dispatch(setHint(res.hint));
        dispatch(setIsHintOpen(true));
      } else {
        alert('無法取得提示');
      }
    } catch (e) {
      console.error(e);
      alert('取得提示時發生錯誤');
    } finally {
      setHintLoading(false);
    }
  };







  const handleSubmit = async () => {
    if (!question) return;
    
    dispatch(setSubmissionLoading(true));
    // Open Submission Modal immediately
    setIsSubmissionModalOpen(true);

    try {
      // Use Remote Streaming Submission
      // systemMessages will be displayed in the Modal in real-time
      const { passed, results, error } = await submitCodeWithStream(code, question._id);
      
      console.log('DEBUG: Submission returned', { passed, results, error });

      if (error) {
          throw new Error(error);
      }

      // Construct Result Object for UI Modal
      // We assume backend returns 'results' as array of { input, expected, actual, passed, error? }
      if (passed !== undefined && results) {
           console.log('DEBUG: Constructing result data');
           const resultData = {
               isCorrect: passed,
               testResult: { 
                   passed, 
                   results: results 
               }, 
               // Mock semantic result for now as Piston doesn't provide it yet
               semanticResult: { 
                   passed: true, 
                   feedback: 'Code validation completed successfully.' 
               } 
           };
           
           dispatch(setSubmissionResult(resultData));

           if (passed) {
               await submitAnswer(question._id, code, true, examId); 
               dispatch(setIsCompleted(true));
               fetchHistoryData();
           } else {
               await submitAnswer(question._id, code, false, examId);
               fetchHistoryData();
           }
      }
      
    } catch (e: any) {
      console.error('Submission error:', e);
      // Don't show error in console, show in Modal
    } finally {
      dispatch(setSubmissionLoading(false));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    router.push('/login');
  };

  return (
    <div className="h-screen flex bg-slate-950 text-slate-100 font-mono overflow-hidden relative selection:bg-indigo-500/30">
        
        <CyberpunkBackground />
      {/* Dragging Overlay */}
      {(isDraggingLeft || isDraggingConsole) && (
        <div className="fixed inset-0 z-[9999] cursor-grabbing bg-transparent" />
      )}

      {/* Backdrop overlay when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - History */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-300">
              <History className="w-5 h-5" />
              <span className="font-bold">Session History</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="text-slate-400 hover:text-white h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center text-slate-500 mt-8 text-xs uppercase tracking-wider">No Records Found</div>
          ) : (
            history.map((item) => (
              <button
                key={item.questionId}
                onClick={() => handleLoadHistoryQuestion(item)}
                className={`w-full mb-2 p-3 rounded-lg border transition-all flex items-center gap-3 group hover:scale-[1.02] ${
                  question?._id === item.questionId
                    ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className={`mt-0.5 ${item.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {item.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-bold text-slate-200 truncate group-hover:text-white transition-colors text-xs font-mono">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    {new Date(item.attemptedAt).toLocaleTimeString()}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 h-full">
        {/* Header */}
        <header className="relative px-6 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 shadow-2xl flex-shrink-0 z-40">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`text-slate-400 hover:text-white transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`}
                    >
                    <Menu className="w-5 h-5" />
                    </Button>
                    <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/subject/${subjectSlug}`)}
                    className="text-slate-400 hover:text-white"
                    >
                    <ArrowLeft className="w-5 w-5" />
                    </Button>
                    
                    <div className="h-6 w-px bg-slate-700/50 mx-1" />
                    
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 rounded-lg shadow-inner">
                            <Code2 className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                                {examTitles[examId] || 'PRACTICE MODE'}
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="absolute w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-[10px] text-slate-400 font-mono pl-3 uppercase tracking-wider">
                                    System Active {isCompleted ? '• Completed' : '• In Progress'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                    onClick={handleGetHint}
                    disabled={hintLoading || !question}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-lg transition-all font-bold text-xs text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed group"
                    >
                    {hintLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                    AI HINT
                    </button>

                    <button
                    onClick={handleSubmit}
                    disabled={submissionLoading || !question}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg transition-all font-bold text-xs text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed group"
                    >
                    {submissionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                    SUBMIT
                    </button>

                    {question && (
                    <button
                        onClick={handleSkip}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all font-bold text-xs text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white"
                    >
                        <SkipForward className="w-3.5 h-3.5" />
                        SKIP
                    </button>
                    )}

                    <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="relative overflow-hidden group flex items-center gap-2 px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs text-white tracking-wide"
                    >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {question ? 'NEXT PROBLEM' : 'START SESSION'}
                    </button>
                    
                    <div className="h-6 w-px bg-slate-700/50 mx-2" />
                    
                    {/* User Profile */}
                    {user && (
                        <div className="flex items-center gap-3">
                            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
                            <Avatar className="h-8 w-8 border border-slate-700 group-hover:border-indigo-500 transition-all ring-1 ring-transparent group-hover:ring-indigo-500/30">
                                <AvatarImage src={user.picture} alt={user.name} />
                                <AvatarFallback className="bg-slate-800 text-indigo-400 text-xs font-bold">{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="hidden lg:block text-left">
                                <p className="text-[10px] font-bold text-indigo-300 group-hover:text-indigo-200 transition-colors uppercase tracking-wider">{user.name}</p>
                            </div>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
        
        <main ref={mainRef} className="flex-1 flex overflow-hidden relative">
            {/* Left Panel: Question */}
            <div 
            className="flex flex-col border-r border-slate-700/50 bg-slate-900/30 backdrop-blur-sm relative z-10"
            style={{ width: `${leftWidth}px`, minWidth: '320px' }}
            >
              <QuestionPanel question={question} loading={loading} />
            </div>

            {/* Resizable Divider (Horizontal) */}
            <div
            style={{ width: '8px', zIndex: 50, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className="bg-slate-950 hover:bg-indigo-500/20 transition-colors relative flex-shrink-0 group border-x border-slate-800/80"
            onMouseDown={() => setIsDraggingLeft(true)}
            >
             <GripVertical className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 transition-colors" />
            </div>

            {/* Right Panel: Editor & Output */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative w-0 bg-slate-900/20">
            {/* Hint Overlay */}
            {isHintOpen && hint && (
                <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-900 border border-amber-500/30 rounded-lg shadow-[0_0_50px_rgba(245,158,11,0.1)] max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <div className="flex items-center gap-2 text-amber-400 font-bold font-mono tracking-wider text-sm uppercase">
                            <Lightbulb className="w-4 h-4" />
                            AI Assistant Analysis
                        </div>
                        <button 
                            onClick={() => dispatch(setIsHintOpen(false))}
                            className="text-slate-500 hover:text-white hover:bg-slate-800 p-1 rounded transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <div className="space-y-4 text-sm font-light">
                            {hint.split('\n').map((line, i) => {
                            const trimmed = line.trim();
                            // Parse inline markdown
                            const parseInline = (text: string) => {
                                const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/);
                                return parts.map((part, j) => {
                                if (part.startsWith('`') && part.endsWith('`')) {
                                    return (
                                    <code key={j} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-800 text-amber-300 font-mono text-xs border border-slate-700">
                                        {part.slice(1, -1)}
                                    </code>
                                    );
                                }
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={j} className="text-amber-200 font-bold">{part.slice(2, -2)}</strong>;
                                }
                                return <span key={j}>{part}</span>;
                                });
                            };
                            
                            if (trimmed.startsWith('### ')) {
                                return (
                                <h3 key={i} className="text-base font-bold text-amber-400 mt-4 mb-2 flex items-center gap-2 font-mono uppercase">
                                    <span className="text-amber-500/50">#</span> {parseInline(trimmed.replace(/^###\s+/, ''))}
                                </h3>
                                );
                            }
                            
                            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                                return (
                                <div key={i} className="flex gap-3 text-slate-300 pl-1">
                                    <span className="text-amber-500/50 mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500/50 shrink-0" />
                                    <span className="leading-relaxed">{parseInline(trimmed.replace(/^[\*\-]\s+/, ''))}</span>
                                </div>
                                );
                            }
        
                            if (/^\d+\.\s/.test(trimmed)) {
                                const num = trimmed.match(/^\d+\./)?.[0];
                                return (
                                <div key={i} className="flex gap-2 text-slate-300 pl-1">
                                    <span className="text-amber-500 font-mono text-xs mt-0.5 min-w-[1.5rem]">{num}</span>
                                    <span className="leading-relaxed">{parseInline(trimmed.replace(/^\d+\.\s/, ''))}</span>
                                </div>
                                );
                            }
                            
                            if (!trimmed) return <div key={i} className="h-2" />;
        
                            return (
                                <p key={i} className="text-slate-300 leading-relaxed">
                                {parseInline(line)}
                                </p>
                            );
                            })}
                        </div>
                        <div className="mt-8 pt-4 border-t border-slate-800 text-center">
                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Analysis Completed</p>
                        </div>
                    </div>
                </div>
                </div>
            )}

            {/* Streaming Submission Modal - Shows streaming status and results */}
            <StreamingSubmissionModal
              isOpen={isSubmissionModalOpen}
              isLoading={submissionLoading}
              messages={systemMessages}
              submissionResult={submissionResult}
              onClose={() => {
                setIsSubmissionModalOpen(false);
                dispatch(setSubmissionResult(null));
              }}
              onNextChallenge={() => {
                setIsSubmissionModalOpen(false);
                dispatch(setSubmissionResult(null));
                handleGenerate();
              }}
            />

            <GenerationModal 
                isOpen={isGenerationModalOpen}
                status={generationStatus}
                messages={generationMessages}
                onClose={() => setIsGenerationModalOpen(false)}
            />

            <EditorPanel 
              code={code}
              onChange={(val) => dispatch(setCode(val || ''))}
              onRun={handleRun}
              isExecuting={executing}
            />
            
            {/* Resizable Divider (Vertical) */}
            <div
                style={{ height: '8px', zIndex: 50, cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="bg-slate-950 hover:bg-indigo-500/20 transition-colors relative flex-shrink-0 group border-y border-slate-800/80"
                onMouseDown={() => setIsDraggingConsole(true)}
            >
                <GripHorizontal className="h-4 w-4 text-slate-700 group-hover:text-indigo-400 transition-colors" />
            </div>
            
            <ConsolePanel 
              output={globalOutput} 
              height={consoleHeight} 
              input={question?.sampleInput}
              expectedOutput={question?.sampleOutput}
              passed={isPassed}
              samples={question?.samples}
              results={runResults}
            />
            </div>
        </main>
      </div>
    </div>
  );
}

