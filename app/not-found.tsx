'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Footer } from '@/components/landing/Footer';
import { Terminal, Home } from 'lucide-react';
import { useAppSelector } from '@/lib/store';

export default function NotFound() {
  const router = useRouter();
  const user = useAppSelector((state) => state.user);
  const userName = user.profile?.name || (user.isAuthenticated ? 'user' : 'username');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    '> [系統警告] 偵測到路徑異常...',
    '> [錯誤代碼] 404 - 目標區塊不存在',
    '> [建議] 請嘗試輸入 "help" 尋求協助',
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalContentRef = useRef<HTMLDivElement>(null);
  const [showCursor, setShowCursor] = useState(true);

  // Auto-scroll
  useEffect(() => {
    if (terminalContentRef.current) {
      terminalContentRef.current.scrollTop = terminalContentRef.current.scrollHeight;
    }
  }, [history]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(prev => !prev), 530);
    return () => clearInterval(interval);
  }, []);

  // Focus input on click
  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleCommand = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase();
    let response: string[] = [];

    switch (cleanCmd) {
      case 'help':
        response = [
          '可用指令：',
          '  home    - 返回首頁基地',
          '  back    - 返回上一頁',
          '  clear   - 清除終端機畫面',
          '  status  - 顯示系統狀態',
        ];
        break;
      case 'home':
        response = ['> 正在啟動空間跳躍引擎...', '> 目標：首頁基地', '> 3... 2... 1...'];
        setHistory(prev => [...prev, `guest@void:~$ ${cmd}`, ...response]);
        setTimeout(() => router.push('/'), 1200);
        return; // Early return to avoid double setHistory
      case 'back':
        response = ['> 正在回溯導航路徑...'];
        setHistory(prev => [...prev, `guest@void:~$ ${cmd}`, ...response]);
        setTimeout(() => router.back(), 800);
        return;
      case 'clear':
        setHistory([]);
        return;
      case 'status':
        response = [
            '---------------------------',
            ' 系統狀態: 嚴重損毀 (404)',
            ' 所在位置: 未知虛空',
            ' 生命維持: 正常',
            '---------------------------'
        ];
        break;
      default:
        if (cleanCmd) {
            response = [`> 指令未識別: ${cmd}`, '> 輸入 "help" 查看可用指令'];
        }
        break;
    }

    if (cleanCmd || response.length > 0) {
        setHistory(prev => [...prev, `${userName}@void:~$ ${cmd}`, ...response]);
    } else {
        setHistory(prev => [...prev, `${userName}@void:~$`]);
    }
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 font-mono relative flex flex-col overflow-hidden selection:bg-indigo-500/30">
      {/* === Dynamic Tech Background === */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0f172a_0%,#020617_100%)]" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[100px] animate-pulse mix-blend-screen" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-1000 mix-blend-screen" />
      <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-violet-600/30 rounded-full blur-[140px] animate-pulse delay-2000 mix-blend-screen" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#475569_1px,transparent_1px),linear-gradient(to_bottom,#475569_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)] opacity-[0.25] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#818cf8_1px,transparent_1px),linear-gradient(to_bottom,#818cf8_1px,transparent_1px)] bg-[size:12rem_12rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.15] pointer-events-none mix-blend-overlay" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] z-0 opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.6)_100%)] z-10" />

      {/* Main Content */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-6 text-center w-full max-w-4xl mx-auto">
        {/* Glitch 404 */}
        <div className="relative mb-8 select-none">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-red-500 tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 text-9xl font-black text-cyan-500 opacity-30 animate-pulse delay-75 mix-blend-screen pointer-events-none translate-x-[2px]">
            404
          </div>
          <div className="absolute inset-0 text-9xl font-black text-indigo-500 opacity-30 animate-pulse delay-150 mix-blend-screen pointer-events-none -translate-x-[2px]">
            404
          </div>
          <div className="text-xl text-red-400 font-bold tracking-[1em] mt-2 uppercase">找不到頁面</div>
        </div>

        {/* Interactive Terminal */}
        <div 
          onClick={focusInput}
          className="bg-slate-900/90 border border-slate-700/50 rounded-lg p-6 w-full max-w-2xl h-80 backdrop-blur-md shadow-2xl shadow-indigo-500/10 mb-8 text-left font-mono text-sm leading-relaxed relative overflow-hidden group flex flex-col cursor-text transition-colors hover:border-slate-500/50"
        >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-slate-800/80 flex items-center px-4 border-b border-slate-700/50 select-none">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="mx-auto text-[10px] text-slate-400 font-bold tracking-widest flex items-center gap-2">
                    <Terminal className="w-3 h-3" />
                    緊急修復終端
                </div>
            </div>

            {/* Terminal Output */}
            <div ref={terminalContentRef} className="flex-1 overflow-y-auto mt-6 pr-2 scrollbar-terminal space-y-1 scroll-smooth">
                {history.map((line, i) => (
                    <div key={i} className={`${line.startsWith('>') ? 'text-yellow-400/90' : 'text-slate-300'}`}>
                        {line}
                    </div>
                ))}
                
                {/* Input Line */}
                <div className="flex items-center gap-2 text-slate-100 pt-1">
                    <span className="text-red-400 font-bold">{userName}@void</span>
                    <span className="text-slate-500">:</span>
                    <span className="text-indigo-400">~</span>
                    <span className="text-slate-500">$</span>
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-transparent border-none outline-none text-slate-100 caret-transparent p-0 m-0"
                            autoComplete="off"
                            autoFocus
                        />
                         {/* Custom Cursor */}
                        <span
                            className={`absolute top-0 text-cyan-400 font-bold transition-opacity ${
                                showCursor ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ left: `${input.length * 0.61}em` }}
                        >
                            ▌
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Button */}
        <Link 
          href="/"
          className="group relative inline-flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-bold text-sm tracking-widest transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
             <Home className="w-4 h-4" /> 返回首頁
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>

      <Footer />
    </div>
  );
}
