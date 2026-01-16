'use client';

import { useState, useEffect } from 'react';
import { generateQuestion, runCode } from '../lib/api';
import Editor from '@monaco-editor/react';
import { Play, Loader2, Sparkles, Code2, Terminal } from 'lucide-react';

interface Question {
  title: string;
  description: string;
  sampleInput: string;
  sampleOutput: string;
  testCases: { input: string; output: string }[];
}

export default function Home() {
  const [topic, setTopic] = useState('Basic Programming Design');
  const [question, setQuestion] = useState<Question | null>(null);
  const [code, setCode] = useState('# write your code here\nprint("Hello World")');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [leftWidth, setLeftWidth] = useState(480);
  const [consoleHeight, setConsoleHeight] = useState(300);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);

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
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
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
      const q = await generateQuestion(topic);
      setQuestion(q);
      setOutput('');
    } catch (e) {
      alert('Error generating question');
      console.error(e);
    } finally {
      setLoading(false);
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
      } else {
        const actual = res.output.trim();
        const expected = expectedOutput ? expectedOutput.trim() : null;
        
        let resultMsg = actual;
        
        if (expected !== null) {
            if (actual === expected) {
                resultMsg = `✅ Correct!\n\nOutput:\n${actual}`;
            } else {
                resultMsg = `❌ Incorrect.\n\nExpected:\n${expected}\n\nActual:\n${actual}`;
            }
        }
        
        setOutput(resultMsg);
      }
    } catch (e) {
      setOutput('❌ Execution failed');
      console.error(e);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="relative px-6 py-4 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-cyan-600/5 to-indigo-600/5" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                TQC Python
              </h1>
              <p className="text-xs text-slate-400 font-medium">Exam Preparation Platform</p>
            </div>
          </div>
          <div className="flex gap-3">
            <select 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-sm text-slate-200 min-w-[260px] font-medium transition-all"
            >
              <option value="Basic Programming Design">1. 基本程式設計</option>
              <option value="Selection Statements">2. 選擇敘述</option>
              <option value="Repetition Structures">3. 迴圈結構</option>
              <option value="Complex Data Structures">4. 進階資料結構</option>
              <option value="Functions">5. 函式 (Functions)</option>
              <option value="List Comprehension and String Operations">6. 串列與字串</option>
              <option value="Error Handling and Files">7. 例外處理與檔案</option>
              <option value="Standard Libraries and Modules">8. 模組與函式庫</option>
              <option value="Object-Oriented Programming">9. 物件導向</option>
            </select>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="relative overflow-hidden group flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-xl shadow-xl shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex overflow-hidden">
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
                  <span className="text-xs font-bold tracking-wider text-indigo-300 uppercase">Question</span>
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
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Sample Input</h3>
                  </div>
                  <pre className="relative p-5 font-mono text-sm text-cyan-200 overflow-x-auto">
                    {question.sampleInput || <span className="text-slate-600 italic">No input required</span>}
                  </pre>
                </div>

                <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative px-5 py-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Sample Output</h3>
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
              <h3 className="text-2xl font-bold text-white mb-3">Ready to Practice?</h3>
              <p className="text-slate-400 max-w-sm leading-relaxed text-sm">Select a category from the dropdown and click Generate to start practicing TQC Python problems.</p>
            </div>
          )}
        </div>

        {/* Resizable Divider (Horizontal) */}
        <div
          style={{ width: '12px', zIndex: 50, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="bg-slate-900 hover:bg-indigo-500/50 transition-colors relative flex-shrink-0 group border-x border-slate-800"
          onMouseDown={() => setIsDraggingLeft(true)}
        >
           <div className="w-1 h-8 bg-slate-700 group-hover:bg-white rounded-full transition-colors" />
        </div>

        {/* Right Panel: Editor & Output */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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
              Run Code
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
            style={{ height: '12px', zIndex: 50, cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
              <span className="text-sm font-bold text-white uppercase tracking-wider">Console Output</span>
              <div className="flex-1" />
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-lg shadow-emerald-500/50" />
              </div>
            </div>
            <pre className="flex-1 p-6 font-mono text-[15px] overflow-auto text-emerald-300 font-semibold leading-relaxed selection:bg-emerald-900/30 tracking-wide">
              {output || <span className="text-slate-600 italic font-normal">Waiting for execution...</span>}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
