'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { submitAnswer, getHint, getHistory, getQuestionById, chatWithTutor } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setUser, logout } from '@/lib/store/slices/userSlice';
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

import {
  Question,
  setCurrentQuestion,
  setHistory,
  setCode,
  setOutput,
  setLoading,
  setExecuting,
  setHint,
  setIsHintOpen,
  setIsCompleted,
  setSubmissionLoading,
  setSubmissionResult,
  updateChatHistory,
  prependChatHistory
} from '@/lib/store/slices/questionsSlice';
import { questionsApi } from '@/lib/api/questions';
import { Subject, Category } from '@/lib/store/slices/subjectsSlice';
import { UserProfile } from '@/lib/store/slices/userSlice';
import { QuestionPanel } from '@/components/exam/QuestionPanel';
import { QuestionList } from '@/components/exam/QuestionList';

import dynamic from 'next/dynamic';

const EditorPanel = dynamic(
  () => import('@/components/exam/EditorPanel').then((mod) => mod.EditorPanel),
  { ssr: false }
);
import { ConsolePanel } from '@/components/exam/ConsolePanel';
import { StreamingSubmissionModal } from '@/components/exam/StreamingSubmissionModal';
import GenerationModal from '@/components/exam/GenerationModal';
import { TutorSidebar } from '@/components/exam/TutorSidebar';
import { Loader2, Sparkles, Code2, ArrowLeft, Lightbulb, X, History, CheckCircle2, XCircle, SkipForward, Menu, LogOut, GripVertical, GripHorizontal, UploadCloud } from 'lucide-react';

interface ExamContentProps {
  subjectSlug: string;
  categorySlug: string;
  initialUser: UserProfile;
  initialSubject: Subject;
  initialCategory: Category | null;
  initialQuestions: any[]; // Use proper type, currently QuestionSummary in QuestionList
  initialCurrentQuestion: Question | null;
}

export function ExamContent({ 
  subjectSlug, 
  categorySlug, 
  initialUser,
  initialQuestions,
  initialCurrentQuestion
}: ExamContentProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Redux state
  const user = useAppSelector((state) => state.user.profile);
  const {
    currentQuestion: question,
    history,
    code,
    output: globalOutput,
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
  } = usePyodide();

  const { 
      submitCodeWithStream, 
      systemMessages,
  } = useRemoteExecution();

  // State for Submission Progress Modal
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  // Hydrate Initial Data
  const hydratedRef = useRef(false);
  useEffect(() => {
      if (hydratedRef.current) return;
      hydratedRef.current = true;

      // 1. Hydrate User
      if (initialUser && !user) {
          dispatch(setUser(initialUser));
      }

      // 2. Hydrate Question List (Need to pass to QuestionList or Store)
      // Since QuestionList fetches on its own, we should update QuestionList to accept props. 
      // OR store it in Redux. For now, let's assume we update QuestionList to take props.
      
      // 3. Hydrate Current Question
      if (initialCurrentQuestion) {
          dispatch(setCurrentQuestion(initialCurrentQuestion));
          dispatch(setCode(initialCurrentQuestion.referenceCode || '# write your code here\nprint("Hello World")'));
      }
      
      // 4. Fetch History (Client-side is fine for specific user history)
      fetchHistoryData();

  }, [dispatch, initialUser, initialCurrentQuestion, user, categorySlug]);

  // Sync Local Output to Redux Console
  useEffect(() => {
    if (localOutput.length > 0) {
      dispatch(setOutput(localOutput.join('\n')));
    }
  }, [localOutput, dispatch]);

  const examId = categorySlug;
  
  // UI local state (layout related)
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

  // Tutor State
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [logicHint, setLogicHint] = useState<string | null>(null);
  const [codeHint, setCodeHint] = useState<string | null>(null);
  
  // Chat State - Managed via Redux per question
  const chatHistories = useAppSelector((state) => state.questions.chatHistories);
  const chatHistory = question ? (chatHistories[question._id] || []) : [];
  
  const [chatLoading, setChatLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // Fetch chat history from DB when question loads
  const loadChatHistory = useCallback(async (questionId: string, limit: number = 20, before?: string) => {
      try {
          if (!before) setChatLoading(true);
          else setHistoryLoading(true); // Loading older messages

          const history = await questionsApi.getChatHistory(questionId, limit, before);
          
          if (history && Array.isArray(history)) {
              if (history.length < limit) {
                  setHasMoreHistory(false);
              } else {
                  setHasMoreHistory(true);
              }

              if (before) {
                  // Prepend older messages
                  dispatch(prependChatHistory({ questionId, messages: history }));
              } else {
                  // Initial load (replace)
                  dispatch(updateChatHistory({ questionId, messages: history }));
              }
          }
      } catch(e) { 
          console.error('Failed to load chat history:', e); 
      } finally {
          setChatLoading(false);
          setHistoryLoading(false);
      }
  }, [dispatch]);

  // Initial load effect
  useEffect(() => {
    if (question?._id) {
       // Reset hasMore on new question
       setHasMoreHistory(true); 
       loadChatHistory(question._id);
    }
  }, [question?._id, loadChatHistory]);

  const handleLoadMoreChat = async () => {
      if (!question || !hasMoreHistory || historyLoading || chatHistory.length === 0) return;
      
      const oldestMessage = chatHistory[0];
      if (oldestMessage?.timestamp) {
          // Convert timestamp to string if it's a number/Date, though API expects string/Date compatible
          const beforeTime = new Date(oldestMessage.timestamp).toISOString();
          await loadChatHistory(question._id, 20, beforeTime);
      }
  };

  // Hint State
  const [showFloatingHint, setShowFloatingHint] = useState(false);
  const lastActivityRef = useRef(Date.now());

  const handleGetTutorLogic = async () => {
        if (!question || !code) return;
        setHintLoading(true);
        setIsTutorOpen(true);
        try {
            // Check if we already have it to save tokens
            if (logicHint) return;

            const result = await getHint(question._id, code, 'logic');
            if (result.hint) {
                setLogicHint(result.hint);
            }
        } catch (error) {
            console.error('Failed to get logic hint:', error);
        } finally {
            setHintLoading(false);
        }
  };

  const handleGetTutorCode = async () => {
        if (!question || !code) return;
        setHintLoading(true);
        try {
            const result = await getHint(question._id, code, 'code');
            if (result.hint) {
                setCodeHint(result.hint);
            }
        } catch (error) {
            console.error('Failed to get code hint:', error);
        } finally {
            setHintLoading(false);
        }
  };

  // Inactivity Check for Floating Hint
  useEffect(() => {
    const checkInactivity = setInterval(() => {
        const inactiveDuration = Date.now() - lastActivityRef.current;
        // Show hint if inactive for 10s, hint not open, not completed, and has code (don't hint on empty if they just loaded)
        // actually hint on empty is fine too ("how to start")
        if (inactiveDuration > 10000 && !isHintOpen && !isCompleted && !showFloatingHint) {
            setShowFloatingHint(true);
        }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [isHintOpen, isCompleted, showFloatingHint]);

  // ... (handleCodeChange is here)
  const handleCodeChange = (newCode: string | undefined) => {
      lastActivityRef.current = Date.now();
      if (showFloatingHint) setShowFloatingHint(false);
      dispatch(setCode(newCode || ''));
  };

  // ...


  const handleRun = async () => {
    dispatch(setExecuting(true));
    dispatch(setOutput('Initializing local Python environment...'));
    setIsPassed(undefined); // Reset status
    setRunResults([]); // Reset results
    // Reset activity to prevent hint popping up while running
    lastActivityRef.current = Date.now();
    setShowFloatingHint(false);

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
          
          // Priority 1: Use sample's own fileAssets if available
          // Priority 2: Use question's global fileAssets as fallback
          // Priority 3: Parse input string for file definition (legacy support)
          let currentFileAssets = { ...(question?.fileAssets || {}) };
          
          if (sample.fileAssets && Object.keys(sample.fileAssets).length > 0) {
              // Sample has its own fileAssets, use them (merge with question's global ones)
              currentFileAssets = { ...currentFileAssets, ...sample.fileAssets };
          } else {
              // Check if input follows "filename: content" pattern for file I/O
              // We support this even if fileAssets is empty, to allow questions to define dynamic file inputs in samples
              // regex notes: use [\s\S] to match newlines instead of /s flag for older ES compatibility if needed
              const fileInputMatch = currentInput.match(/^([a-zA-Z0-9_\-\.]+):\s*([\s\S]*)/);
              if (fileInputMatch) {
                 const fileName = fileInputMatch[1];
                 const fileContent = fileInputMatch[2];
                 
                 // Check if this looks like a file definition we should respect
                 // Simple heuristic: if the filename has an extension txt/csv/json/py
                 if (fileName.match(/\.(txt|csv|json|py|dat)$/i)) {
                     currentFileAssets[fileName] = fileContent;
                     currentInput = ''; // Clear stdin since it's file content
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

  const handleSendChat = async (message: string) => {
    if (!question || !code) return;
    
    // Optimistic Update
    const newHistory = [...chatHistory, { role: 'user' as const, message }];
    dispatch(updateChatHistory({ questionId: question._id, messages: newHistory }));
    
    setChatLoading(true);

    try {
        // Only send last 10 messages for context + current message
        // Filter out any potential error messages from history if we want (optional)
        const recentContext = newHistory.slice(-20); 

        const result = await chatWithTutor(question._id, code, recentContext, message);
        
        // Check if response is string or object (API might return { response: string })
        const reply = typeof result === 'string' ? result : result.response;
        
        const finalHistory = [...newHistory, { role: 'model' as const, message: reply }];
        dispatch(updateChatHistory({ questionId: question._id, messages: finalHistory }));

    } catch (error) {
        console.error('Chat failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorHistory = [...newHistory, { role: 'model' as const, message: `抱歉，發生錯誤：${errorMessage}` }];
        dispatch(updateChatHistory({ questionId: question._id, messages: errorHistory }));
    } finally {
        setChatLoading(false);
    }
  };

  // Load question from URL param 'q' if present (Mock Exam Navigation)
  // Only update if searchParam changes and differs from current (SSR handled initial load)
  const searchParams = useSearchParams();
  const qId = searchParams.get('q');
  const prevQIdRef = useRef<string | null>(initialCurrentQuestion?._id || null);

  useEffect(() => {
    // If SSR loaded it initially, we don't need to re-fetch on mount unless qId changed client-side
    // Logic: if qId exists and != currentQuestion._id, fetch it.
      if (qId && (!question || question._id !== qId)) {
          const loadSpecificQuestion = async () => {
              dispatch(setLoading(true));
              try {
                  const q = await getQuestionById(qId);
                  dispatch(setCurrentQuestion(q));
                  // Reset state for new question
                  dispatch(setCode(q.referenceCode || '# write your code here\n'));
                  dispatch(setOutput(''));
                  dispatch(setHint(null));
                  dispatch(setIsHintOpen(false));
                  dispatch(setIsCompleted(false));
                  setRunResults([]);
                  setIsPassed(undefined);
              } catch (e) {
                  console.error('Failed to load specific question:', e);
              } finally {
                  dispatch(setLoading(false));
              }
          };
          loadSpecificQuestion();
      }
  }, [qId, question, dispatch]);

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
      // Force generation to skip database check if desired, or if we want streaming we always force? 
      // The previous code passed `true` (force). Streaming endpoint supports force param.
      
      const response = await fetch(`/api/questions/stream?category=${examId}&force=true`, {
          credentials: 'include',
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
          setIsPassed(item.isCorrect); 
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
    handleGetTutorLogic();
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

  const handleLogout = async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (e) {
        console.error('Logout failed', e);
    } finally {
        // Always redirect even if API fails
        dispatch(logout());
        router.push('/login');
    }
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

      {/* Left Sidebar - Navigation & History */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-indigo-300">
              <Menu className="w-5 h-5" />
              <span className="font-bold">Exam Navigation</span>
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
          
          {/* Question List (Top Part) */}
          <div className="flex-1 min-h-0 border-b border-slate-700/50">
             <QuestionList 
                categorySlug={categorySlug}
                currentQuestionId={question?._id}
                initialQuestions={initialQuestions} // Pass hydrated list
                className="w-full h-full border-none bg-transparent"
                onSelectQuestion={(id) => {
                    router.push(`/exam/${subjectSlug}/${categorySlug}?q=${id}`);
                }}
            />
          </div>

          {/* Session History (Bottom Part) */}
          <div className="h-1/3 flex flex-col min-h-[200px] bg-slate-900/50">
            <div className="px-4 py-2 border-b border-slate-700/50 flex items-center gap-2 text-slate-400">
               <History className="w-4 h-4" />
               <span className="text-xs font-bold uppercase tracking-wider">Session History</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {history.length === 0 ? (
                <div className="text-center text-slate-500 mt-4 text-xs uppercase tracking-wider">No Records</div>
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

            {/* Right Panel: Editor & Output & Tutor Side-by-Side */}
            <div className="flex-1 flex flex-row min-w-0 h-full overflow-hidden relative w-0 bg-slate-900/20">
                
                {/* Editor Container */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative">
                    
                    {/* Context-Aware Floating Hint TRIGGER */}
                    {showFloatingHint && !isTutorOpen && (
                        <div className="absolute bottom-6 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <button
                                onClick={() => setIsTutorOpen(true)} // Just open chat, don't generate hint
                                disabled={hintLoading}
                                className="flex items-center gap-3 px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all group backdrop-blur-md"
                            >
                                <div className="p-1.5 bg-indigo-500/20 rounded-full group-hover:bg-indigo-500/30 transition-colors">
                                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                                </div>
                                <div className="text-left mr-2">
                                    <p className="text-xs font-bold text-indigo-300">需要幫忙嗎？</p>
                                    <p className="text-[10px] text-indigo-400/70">點擊開啟 AI 導師</p>
                                </div>
                            </button>
                        </div>
                    )}

                    <div className="flex-1 min-h-0 relative">
                    <EditorPanel 
                        code={code}
                        onChange={handleCodeChange}
                        onRun={handleRun}
                        isExecuting={executing}
                    />
                    </div>
                    
                    {/* Resizable Divider (Vertical) */}
                    <div
                        style={{ height: '8px', zIndex: 50, cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        className="bg-slate-950 hover:bg-indigo-500/20 transition-colors relative flex-shrink-0 group border-y border-slate-800/80"
                        onMouseDown={() => setIsDraggingConsole(true)}
                    >
                    <GripHorizontal className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 transition-colors" />
                    </div>

                    {/* Output Console */}
                    <div 
                        style={{ height: `${consoleHeight}px` }}
                        className="flex-shrink-0 bg-slate-950/50 backdrop-blur-sm relative"
                    >
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
                </div>

                {/* AI Tutor Sidebar (Collapsible) */}
                <TutorSidebar
                    isOpen={isTutorOpen}
                    onClose={() => setIsTutorOpen(false)}
                    chatHistory={chatHistory}
                    onSendChat={handleSendChat}
                    chatLoading={chatLoading}
                    onLoadMore={handleLoadMoreChat}
                    hasMore={hasMoreHistory}
                />

            </div>

            {/* Streaming Submission Modal - Shows streaming status and results */}
            <StreamingSubmissionModal
              isOpen={isSubmissionModalOpen}
              isLoading={submissionLoading}
              messages={systemMessages}
              submissionResult={submissionResult}
              initialTestCases={question?.testCases || (question?.samples ? question.samples.map((s, i) => ({ input: s.input, output: s.output })) : [])}
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
        </main>
      </div>
    </div>
  );
}
