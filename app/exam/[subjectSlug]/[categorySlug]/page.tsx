'use client';

import { use, useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getNextQuestion, runCode, submitAnswer, getHint, getHistory, getQuestionById } from '../../../../lib/api';
import { useAppDispatch, useAppSelector } from '../../../../lib/store';
import { setUser, logout } from '../../../../lib/store/slices/userSlice';
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
} from '../../../../lib/store/slices/questionsSlice';
import { QuestionPanel } from '../../../../components/exam/QuestionPanel';
import { EditorPanel } from '../../../../components/exam/EditorPanel';
import { ConsolePanel } from '../../../../components/exam/ConsolePanel';
import { Play, Loader2, Sparkles, Code2, Terminal, ArrowLeft, Lightbulb, X, History, CheckCircle2, XCircle, SkipForward, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { HistoryItem } from '../../../../lib/store/slices/questionsSlice';

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
    output,
    loading,
    executing,
    hint,
    isHintOpen,
    isCompleted,
  } = useAppSelector((state) => state.questions);

  const examId = categorySlug;
  
  // UI local state (layout related)
  const [leftWidth, setLeftWidth] = useState(480);
  const [consoleHeight, setConsoleHeight] = useState(300);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Hint loading state (UI only)
  const [hintLoading, setHintLoading] = useState(false);

  const fetchHistoryData = useCallback(async () => {
    try {
      const data = await getHistory(examId);
      dispatch(setHistory(data));
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  }, [examId, dispatch]);

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
      if (isDraggingLeft) {
        const newWidth = e.clientX;
        if (newWidth >= 300 && newWidth <= 800) setLeftWidth(newWidth);
      }
      
      if (isDraggingConsole) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight >= 100 && newHeight <= window.innerHeight - 200) setConsoleHeight(newHeight);
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
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft, isDraggingConsole]);

  const handleGenerate = async () => {
    dispatch(setLoading(true));
    try {
      // Use examId (category) directly, forcing new question generation
      const q = await getNextQuestion(examId, true);
      dispatch(setCurrentQuestion(q));
      dispatch(setOutput(''));
      dispatch(setHint(null));
      dispatch(setIsHintOpen(false));
      dispatch(setIsCompleted(false));
      dispatch(setCode('# write your code here\nprint("Hello World")'));
      
      fetchHistoryData();
    } catch (e) {
      alert('Error generating question');
      console.error(e);
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

  const handleRun = async () => {
    if (!question) {
        executeCode('');
        return;
    }
    
    executeCode(question.sampleInput, question.sampleOutput);
  };

  const executeCode = async (input: string, expectedOutput?: string) => {
    dispatch(setExecuting(true));
    try {
      const res = await runCode(code, input);
      if (res.error) {
        dispatch(setOutput(`❌ Error:\n${res.error}`));
        // Record failed attempt (error)
        if (question) {
             await submitAnswer(question._id, code, false, examId);
             fetchHistoryData();
        }
      } else {
        const actual = res.output.trim();
        const expected = expectedOutput ? expectedOutput.trim() : null;
        
        let resultMsg = actual;
        let isCorrect = false;
        
        if (expected !== null) {
            if (actual === expected) {
                resultMsg = `✅ Correct!\n\nOutput:\n${actual}`;
                isCorrect = true;
            } else {
                resultMsg = `❌ Incorrect.\n\nExpected:\n${expected}\n\nActual:\n${actual}`;
            }
        }
        
        dispatch(setOutput(resultMsg));

        // Record attempt
        if (question) {
            await submitAnswer(question._id, code, isCorrect, examId);
            fetchHistoryData();
            dispatch(setIsCompleted(true));
        }
      }
    } catch (e) {
      dispatch(setOutput('❌ Execution failed'));
      console.error(e);
    } finally {
      dispatch(setExecuting(false));
    }
  };

  return (
    <div className="h-screen flex bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Backdrop overlay when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - History - Now as overlay */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-300">
              <History className="w-5 h-5" />
              <span className="font-bold">練習記錄</span>
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
          <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="text-center text-slate-500 mt-8">尚無練習記錄</div>
          ) : (
            history.map((item) => (
              <button
                key={item.questionId}
                onClick={() => handleLoadHistoryQuestion(item)}
                className={`w-full mb-2 p-3 rounded-lg border transition-all flex items-center gap-3 group hover:scale-[1.02] ${
                  question?._id === item.questionId
                    ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className={`mt-0.5 ${item.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {item.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-200 truncate group-hover:text-white transition-colors text-sm">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(item.attemptedAt).toLocaleString()}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="relative px-6 py-4 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl flex-shrink-0 z-40">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-cyan-600/5 to-indigo-600/5" />
            <div className="relative flex items-center justify-between">
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
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl shadow-lg shadow-indigo-500/20">
                <Code2 className="w-6 h-6 text-white" />
                </div>
                <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                    {examTitles[examId] || 'Praxis'}
                </h1>
                <p className="text-xs text-slate-400 font-medium">持續練習模式 ({isCompleted ? '已完成' : '進行中'})</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button
                   onClick={handleGetHint}
                   disabled={hintLoading || !question}
                   className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-all font-bold text-xs text-amber-300 disabled:opacity-50"
                >
                   {hintLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                   提示
                </button>

                {question && (
                  <button
                    onClick={handleSkip}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all font-bold text-xs text-slate-300 disabled:opacity-50"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    跳過
                  </button>
                )}

                <button
                onClick={handleGenerate}
                disabled={loading}
                className="relative overflow-hidden group flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-xl shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm"
                >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {question ? '下一題' : '開始練習'}
                </button>
                {user && (
                <div className="flex items-center gap-2 ml-2">
                    <Avatar className="h-8 w-8">
                    <AvatarImage src={user.picture} alt={user.name} />
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
                )}
            </div>
            </div>
        </header>
        
        <main className="flex-1 flex overflow-hidden relative">
            {/* Left Panel: Question */}
            <div 
            className="flex flex-col border-r border-slate-700/50 bg-gradient-to-b from-slate-900/50 to-slate-900/30 backdrop-blur-sm"
            style={{ width: `${leftWidth}px`, minWidth: '320px', maxWidth: '800px' }}
            >
              <QuestionPanel question={question} loading={loading} />
            </div>

            {/* Resizable Divider (Horizontal) */}
            <div
            style={{ width: '12px', zIndex: 40, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className="bg-slate-900 hover:bg-indigo-500/50 transition-colors relative flex-shrink-0 group border-x border-slate-800"
            onMouseDown={() => setIsDraggingLeft(true)}
            >
            <div className="w-1 h-8 bg-slate-700 group-hover:bg-white rounded-full transition-colors" />
            </div>

            {/* Right Panel: Editor & Output */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
            {/* Hint Overlay */}
            {isHintOpen && hint && (
                <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                        <div className="flex items-center gap-2 text-amber-400 font-bold">
                            <Lightbulb className="w-5 h-5 fill-amber-400/20" />
                            AI 學習提示
                        </div>
                        <button 
                            onClick={() => dispatch(setIsHintOpen(false))}
                            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <div className="space-y-3">
                            {hint.split('\n').map((line, i) => {
                            const trimmed = line.trim();
                            
                            // Parse inline markdown
                            const parseInline = (text: string) => {
                                const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/);
                                return parts.map((part, j) => {
                                if (part.startsWith('`') && part.endsWith('`')) {
                                    return (
                                    <code key={j} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-800/80 text-amber-300 font-mono text-sm border border-slate-700/50">
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
                                <h3 key={i} className="text-base font-bold text-amber-400 mt-3 mb-1.5 flex items-center gap-2">
                                    {parseInline(trimmed.replace(/^###\s+/, ''))}
                                </h3>
                                );
                            }
                            
                            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                                return (
                                <div key={i} className="flex gap-2 text-slate-300 text-sm leading-relaxed pl-1">
                                    <span className="text-amber-400/60 mt-0.5">•</span>
                                    <span>{parseInline(trimmed.replace(/^[\*\-]\s+/, ''))}</span>
                                </div>
                                );
                            }
        
                            if (/^\d+\.\s/.test(trimmed)) {
                                const num = trimmed.match(/^\d+\./)?.[0];
                                return (
                                <div key={i} className="flex gap-2 text-slate-300 text-sm leading-relaxed pl-1">
                                    <span className="text-amber-400/80 font-mono text-xs mt-0.5 min-w-[1.5rem]">{num}</span>
                                    <span>{parseInline(trimmed.replace(/^\d+\.\s/, ''))}</span>
                                </div>
                                );
                            }
                            
                            if (!trimmed) return <div key={i} className="h-1" />;
        
                            return (
                                <p key={i} className="text-slate-300 text-sm leading-relaxed">
                                {parseInline(line)}
                                </p>
                            );
                            })}
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-800">
                            <p className="text-xs text-slate-500 text-center">提示僅供參考，請試著自己思考看看！</p>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end">
                        <Button 
                            onClick={() => dispatch(setIsHintOpen(false))}
                            className="bg-slate-800 hover:bg-slate-700 text-white"
                        >
                            了解
                        </Button>
                    </div>
                </div>
                </div>
            )}

            <EditorPanel 
              code={code}
              onChange={(val) => dispatch(setCode(val || ''))}
              onRun={handleRun}
              isExecuting={executing}
            />
            
            {/* Resizable Divider (Vertical) */}
            <div
                style={{ height: '12px', zIndex: 40, cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="bg-slate-900 hover:bg-indigo-500/50 transition-colors relative flex-shrink-0 group border-y border-slate-800"
                onMouseDown={() => setIsDraggingConsole(true)}
            >
                <div className="h-1 w-16 bg-slate-700 group-hover:bg-white rounded-full transition-colors" />
            </div>
            
            <ConsolePanel output={output} height={consoleHeight} />
            </div>
        </main>
      </div>
    </div>
  );
}
