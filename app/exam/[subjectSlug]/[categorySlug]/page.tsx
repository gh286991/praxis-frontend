'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getNextQuestion, runCode, submitAnswer, getHint, getHistory, getQuestionById } from '../../../../lib/api';
import Editor from '@monaco-editor/react';
import { Play, Loader2, Sparkles, Code2, Terminal, ArrowLeft, Lightbulb, X, History, CheckCircle2, XCircle, SkipForward, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Question {
  _id: string;
  title: string;
  description: string;
  sampleInput: string;
  sampleOutput: string;
  testCases: { input: string; output: string }[];
}

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

interface HistoryItem {
  questionId: string;
  title: string;
  isCorrect: boolean;
  attemptedAt: string;
  code?: string;
}

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
  const examId = categorySlug;
  // const topic = examTopics[examId] || 'Basic Programming Design';
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [code, setCode] = useState('# write your code here\nprint("Hello World")');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [leftWidth, setLeftWidth] = useState(480);
  const [consoleHeight, setConsoleHeight] = useState(300);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  
  // Hint state
  const [hintLoading, setHintLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [isHintOpen, setIsHintOpen] = useState(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Track if current question is completed (submitted) to avoid double submission
  const [isCompleted, setIsCompleted] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getHistory(examId);
      setHistory(data);
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  }, [examId]);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }

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
        setUser(data);
        // Fetch history after user is loaded
        fetchHistory();
      })
      .catch(() => {
        localStorage.removeItem('jwt_token');
        router.push('/login');
      });
  }, [router, examId, fetchHistory]);

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
    setLoading(true);
    try {
      // Use examId (category) directly, forcing new question generation
      const q = await getNextQuestion(examId, true);
      setQuestion(q);
      setOutput('');
      setHint(null);
      setIsHintOpen(false);
      setIsCompleted(false); // Reset completion status for new question
      setCode('# write your code here\nprint("Hello World")');
      
      // Refresh history to show updated list
      fetchHistory();
    } catch (e) {
      alert('Error generating question');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSkip = async () => {
      // Logic is merged into handleGenerate, as both "Next" and "Skip" imply moving on.
      // If user passed, isCompleted would be true, so handleGenerate won't submit as fail.
      // If user didn't pass, isCompleted is false, so handleGenerate will submit as fail (skip).
      await handleGenerate();
  };

  const handleLoadHistoryQuestion = async (item: HistoryItem) => {
      setLoading(true);
      try {
          const q = await getQuestionById(item.questionId);
          setQuestion(q);
          // Restore their code if available, otherwise default
          setCode(item.code || '# write your code here\nprint("Hello World")');
          setOutput('');
          setHint(null);
          setIsHintOpen(false);
          setIsSidebarOpen(false); // Close sidebar on selection
          setIsCompleted(true); // History questions are considered completed/view-only or re-attempt. 
                                // If re-attempt logic is needed, we might set false, but then moving away records fail? 
                                // For now assume viewing history doesn't auto-fail on exit.
      } catch (e) {
          console.error(e);
          alert('Failed to load question');
      } finally {
          setLoading(false);
      }
  };
  
  const handleGetHint = async () => {
    if (!question) return;
    
    setHintLoading(true);
    try {
      const res = await getHint(question._id, code);
      if (res.hint) {
        setHint(res.hint);
        setIsHintOpen(true);
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
    setExecuting(true);
    try {
      const res = await runCode(code, input);
      if (res.error) {
        setOutput(`❌ Error:\n${res.error}`);
        // Record failed attempt (error)
        if (question) {
             await submitAnswer(question._id, code, false, examId);
             fetchHistory(); // Refresh history
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
        
        setOutput(resultMsg);

        // Record attempt
        if (question) {
            await submitAnswer(question._id, code, isCorrect, examId);
            fetchHistory(); // Refresh history
            setIsCompleted(true); // Mark as completed so we don't auto-fail on next
        }
      }
    } catch (e) {
      setOutput('❌ Execution failed');
      console.error(e);
      // Logic for execution failure:
      // If execution fails (syntax error etc), we might want to record it as fail too?
      // Currently catch block sets output but doesn't submit. 
      // User says "skip... record". Running and failing syntax is an attempt?
      // Let's leave catch block as is (no submission), so if they skip after syntax error, it records as fail (via handleGenerate logic).
    } finally {
      setExecuting(false);
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

      {/* Main Content - No longer needs margin */}
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
                    {examTitles[examId] || 'TQC Python'}
                </h1>
                <p className="text-xs text-slate-400 font-medium">持續練習模式</p>
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
            {question ? (
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-xs font-bold tracking-wider text-indigo-300 uppercase">題目</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">{question.title}</h2>
                    <div className="prose prose-invert prose-slate max-w-none">
                    <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap">{question.description}</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-cyan-900/10 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative px-5 py-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/50 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">範例輸入</h3>
                    </div>
                    <pre className="relative p-5 font-mono text-sm text-cyan-200 overflow-x-auto">
                        {question.sampleInput || <span className="text-slate-600 italic">無需輸入</span>}
                    </pre>
                    </div>

                    <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative px-5 py-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/50 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">範例輸出</h3>
                    </div>
                    <pre className="relative p-5 font-mono text-sm text-emerald-200 overflow-x-auto">{question.sampleOutput}</pre>
                    </div>
                </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur-2xl opacity-20 animate-pulse" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center border border-slate-700 shadow-2xl">
                    <Sparkles className="w-12 h-12 text-indigo-400" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">開始練習</h3>
                <p className="text-slate-400 max-w-sm leading-relaxed text-sm">點擊上方「開始練習」按鈕開始 TQC Python 題目。</p>
                </div>
            )}
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
                            onClick={() => setIsHintOpen(false)}
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
                            onClick={() => setIsHintOpen(false)}
                            className="bg-slate-800 hover:bg-slate-700 text-white"
                        >
                            了解
                        </Button>
                    </div>
                </div>
                </div>
            )}

            {/* Editor Toolbar */}
            <div className="px-6 py-3 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 flex justify-between items-center shadow-lg flex-shrink-0">
                <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-lg shadow-cyan-500/50" />
                <span className="text-sm font-bold text-white tracking-wide">solution.py</span>
                </div>
                <button
                onClick={handleRun}
                disabled={executing}
                className="relative overflow-hidden group flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg shadow-xl shadow-emerald-900/30 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                執行程式碼
                </button>
            </div>

            {/* Editor */}
            <div className="flex-1 relative min-h-0 overflow-hidden">
                <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                    minimap: { enabled: false },
                    fontSize: 15,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    fontWeight: '500',
                    padding: { top: 20, bottom: 20 },
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    renderLineHighlight: "all",
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    lineHeight: 24,
                    letterSpacing: 0.5
                }}
                />
            </div>
            
            {/* Resizable Divider (Vertical) */}
            <div
                style={{ height: '12px', zIndex: 40, cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="bg-slate-900 hover:bg-indigo-500/50 transition-colors relative flex-shrink-0 group border-y border-slate-800"
                onMouseDown={() => setIsDraggingConsole(true)}
            >
                <div className="h-1 w-16 bg-slate-700 group-hover:bg-white rounded-full transition-colors" />
            </div>
            
            {/* Console Output */}
            <div 
                className="bg-gradient-to-b from-black to-slate-950 border-t border-slate-700/50 flex flex-col shadow-2xl flex-shrink-0"
                style={{ height: `${consoleHeight}px` }}
            >
                <div className="px-5 py-3 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 flex items-center gap-3">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">執行結果</span>
                <div className="flex-1" />
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-lg shadow-emerald-500/50" />
                </div>
                </div>
                <pre className="flex-1 p-6 font-mono text-[15px] overflow-auto text-emerald-300 font-semibold leading-relaxed selection:bg-emerald-900/30 tracking-wide">
                {output || <span className="text-slate-600 italic font-normal">等待執行...</span>}
                </pre>
            </div>
            </div>
        </main>
      </div>
    </div>
  );
}
