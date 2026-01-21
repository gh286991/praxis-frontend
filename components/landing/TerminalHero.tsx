'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Zap, Users, Database, Globe } from 'lucide-react';
import { getPlatformStats } from '../../lib/api';
import { Footer } from './Footer';
import { useAppSelector } from '@/lib/store';

const ASCII_LOGO = `
██████╗ ██████╗  █████╗ ██╗  ██╗██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗██╔╝██║██╔════╝
██████╔╝██████╔╝███████║ ╚███╔╝ ██║███████╗
██╔═══╝ ██╔══██╗██╔══██║ ██╔██╗ ██║╚════██║
██║     ██║  ██║██║  ██║██╔╝ ██╗██║███████║
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝
`;

const WELCOME_TEXT = [
  '> Kernel initialized.',
  '> Mounting virtual file system...',
  '> Loading core services...',
  '> [AI ENGINE] ...... ONLINE',
  '> [RUNTIME] ........ ONLINE',
  '> [ANALYTICS] ...... ONLINE',
  '----------------------------------------',
  '   Praxis AI Learning Environment v2.0',
  '----------------------------------------',
  '',
  '歡迎來到 Praxis —— 您的專屬 AI 程式導師',
  '',
  '我們致力於提供最流暢的 Python 學習體驗：',
  '• 智能題庫：AI 動態生成試題，讓您永遠有新挑戰',
  '• 雲端執行：免建置環境，瀏覽器即是您的 IDE',
  '• 實力分析：視覺化數據報表，精準掌握學習盲點',
  '',
  '系統準備就緒。輸入 start 開始您的練習旅程。',
];

const HELP_TEXT = [
  '',
  '可用指令:',
  '  start    - 開始練習 (前往儀表板)',
  '  login    - 登入帳號',
  '  about    - 關於本平台',
  '  status   - 顯示系統狀態',
  '  ls       - 列出目錄',
  '  clear    - 清除畫面',
  '  demo     - 執行範例程式碼',
  '',
];

const ABOUT_TEXT = [
  '',
  '╔══════════════════════════════════════════════════════════════╗',
  '║  Praxis Service Overview                                     ║',
  '║  ──────────────────────────────────────────────────────────  ║',
  '║  Praxis 是一個結合人工智慧與教育理論的現代化學習平台。         ║',
  '║  我們相信透過持續的實作與即時反饋，能最有效地提升程式技能。     ║',
  '║                                                              ║',
  '║  我們的願景是讓每一位學習者都能擁有專屬的 AI 助教，            ║',
  '║  隨時隨地，想學就學。                                         ║',
  '╚══════════════════════════════════════════════════════════════╝',
  '',
];

interface TerminalHeroProps {
  initialStats?: {
    activeLearners: number;
    totalQuestions: number;
    totalExecutions: number;
  };
}

export function TerminalHero({ initialStats }: TerminalHeroProps) {
  const router = useRouter();
  const user = useAppSelector((state) => state.user);
  const userName = user.profile?.name || (user.isAuthenticated ? 'user' : 'username');
  const [isMounted, setIsMounted] = useState(false);
  const [displayedLogo, setDisplayedLogo] = useState('');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isLogoComplete, setIsLogoComplete] = useState(false);
  const [isWelcomeComplete, setIsWelcomeComplete] = useState(false);
  // System Monitor State
  const [aiLatency, setAiLatency] = useState(45);
  const [activeUsers, setActiveUsers] = useState(initialStats?.activeLearners || 0); 
  const [totalQuestions, setTotalQuestions] = useState(initialStats?.totalQuestions || 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Ensure client-side only rendering to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    
    // Only fetch if we didn't get initial stats (or maybe we want to refresh? let's stick to initial if present)
    if (!initialStats) {
      getPlatformStats().then(stats => {
        setActiveUsers(stats.activeLearners);
        setTotalQuestions(stats.totalQuestions);
      }).catch(err => console.error('Failed to fetch platform stats:', err));
    }
  }, [initialStats]);

  // Simulator Effect (Only for Latency now)
  useEffect(() => {
    const interval = setInterval(() => {
      setAiLatency(prev => {
        const variation = Math.floor(Math.random() * 20 - 10);
        return Math.min(Math.max(prev + variation, 25), 150);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((prev) => !prev), 530);
    return () => clearInterval(interval);
  }, []);

  // ASCII Logo typing animation - only run on client
  useEffect(() => {
    if (!isMounted) return;
    
    let i = 0;
    const logoChars = ASCII_LOGO.split('');
    const interval = setInterval(() => {
      if (i < logoChars.length) {
        const char = logoChars[i];
        if (char) {
          setDisplayedLogo((prev) => prev + char);
        }
        i++;
      } else {
        clearInterval(interval);
        setIsLogoComplete(true);
      }
    }, 2); // Fast typing
    return () => clearInterval(interval);
  }, [isMounted]);

  // Welcome text typing animation
  useEffect(() => {
    if (!isLogoComplete) return;
    
    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < WELCOME_TEXT.length) {
        setTerminalLines((prev) => [...prev, WELCOME_TEXT[lineIndex]]);
        lineIndex++;
      } else {
        clearInterval(interval);
        setIsWelcomeComplete(true);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [isLogoComplete]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines, isWelcomeComplete]);

  // Focus input when ready
  useEffect(() => {
    if (isWelcomeComplete && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isWelcomeComplete]);

  const processCommand = (cmd: string) => {
    const command = cmd.toLowerCase().trim();
    setTerminalLines((prev) => [...prev, `${userName}@praxis:~$ ${cmd}`]);

    switch (command) {
      case 'start': {
          setTerminalLines((prev) => [...prev, '> 正在載入儀表板...']);
          setTimeout(() => router.push('/courses'), 800);
        break;
      }
      case 'login':
        setTerminalLines((prev) => [...prev, '> 正在導向登入頁面...']);
        setTimeout(() => router.push('/login'), 800);
        break;
      case 'help':
        setTerminalLines((prev) => [...prev, ...HELP_TEXT]);
        break;
      case 'about':
        setTerminalLines((prev) => [...prev, ...ABOUT_TEXT]);
        break;
      case 'clear':
        setTerminalLines([]);
        break;
      case 'ls':
        setTerminalLines((prev) => [
          ...prev,
          `drwxr-xr-x  ${userName}  praxis  4096  exercises`,
          `drwxr-xr-x  ${userName}  praxis  4096  courses`,
          `drwxr-xr-x  ${userName}  praxis  4096  settings`,
          `-rw-r--r--  ${userName}  praxis   512  README.md`,
          ''
        ]);
        break;
      case 'whoami':
        setTerminalLines((prev) => [...prev, `${userName}@praxis-terminal`]);
        break;
      case 'date':
        setTerminalLines((prev) => [...prev, new Date().toString()]);
        break;
      case 'status':
        setTerminalLines((prev) => [
          ...prev, 
          'System Status: OPTIMAL',
          'CPU Load: 12%',
          'Memory: 4.2GB / 16GB',
          'Network: Connected (Low Latency)',
          ''
        ]);
        break;
      case 'demo':
        setTerminalLines((prev) => [
          ...prev,
          '',
          '>>> print("Hello, Praxis!")',
          'Hello, Praxis!',
          '',
          '>>> for i in range(3):',
          '...     print(f"Iteration {i}")',
          'Iteration 0',
          'Iteration 1',
          'Iteration 2',
          '',
        ]);
        break;
      case '':
        break;
      default:
        setTerminalLines((prev) => [
          ...prev,
          `> 未知指令: ${cmd}`,
          '> 輸入 help 查看可用指令。',
        ]);
    }
    setCurrentInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processCommand(currentInput);
    }
  };

  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div
      className="h-screen bg-slate-950 text-slate-200 font-mono relative flex flex-col overflow-hidden selection:bg-indigo-500/30"
      onClick={handleTerminalClick}
    >
      {/* === Dynamic Tech Background === */}
      
      {/* 1. Deep Space Base - Richer Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0f172a_0%,#020617_100%)]" />
      
      {/* 2. Animated Nebula Orbs (Intensified) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[100px] animate-pulse mix-blend-screen" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-1000 mix-blend-screen" />
      <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-violet-600/30 rounded-full blur-[140px] animate-pulse delay-2000 mix-blend-screen" />
      
      {/* 3. Digital Grid System - More Visible */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#475569_1px,transparent_1px),linear-gradient(to_bottom,#475569_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)] opacity-[0.25] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#818cf8_1px,transparent_1px),linear-gradient(to_bottom,#818cf8_1px,transparent_1px)] bg-[size:12rem_12rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.15] pointer-events-none mix-blend-overlay" />

      {/* 4. CRT/Scanline Effects */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] z-0 opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.6)_100%)] z-10" />

      {/* === Content Layer === */}

      {/* Terminal Container */}
      <div className="relative z-10 flex-1 min-h-0 w-full max-w-[1920px] mx-auto p-6 md:p-12 overflow-hidden grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Spacer for Asymmetric Layout (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-1" />
        {/* Main Terminal Area */}
        <div className="flex flex-col overflow-hidden lg:col-span-3 h-full">
        {/* ASCII Logo - Fixed at top */}
        <div className="flex-shrink-0 mb-6 px-4 pt-4">
          <pre className="text-[0.4rem] sm:text-[0.55rem] md:text-xs lg:text-sm text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 whitespace-pre leading-tight font-bold select-none drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            {displayedLogo}
            {!isLogoComplete && <span className="text-cyan-400">▌</span>}
          </pre>
        </div>

        {/* Main Terminal Scroll Area */}
        <div 
          ref={terminalRef}
          className="flex-1 overflow-y-auto scrollbar-terminal pr-4 scroll-smooth"
        >

          {/* Terminal Output */}
          <div className="space-y-1">
            {terminalLines.map((line, index) => {
              const lineStr = line ?? '';
              const colorClass = lineStr.startsWith('>')
                ? 'text-cyan-400'
                : lineStr.startsWith('╔') || lineStr.startsWith('║') || lineStr.startsWith('╚')
                ? 'text-indigo-400'
                : lineStr.startsWith('>>>')
                ? 'text-yellow-400'
                : lineStr.startsWith('...')
                ? 'text-yellow-400/70'
                : 'text-slate-300';
              return (
                <div
                  key={index}
                  className={`text-sm md:text-base leading-relaxed ${colorClass}`}
                >
                  {lineStr || '\u00A0'}
                </div>
              );
            })}
          </div>

          {/* Input Line (Part of scroll flow) */}
          {isWelcomeComplete && (
            <div className="flex items-center gap-2 mt-4 text-sm md:text-base pb-2">
              <span className="text-emerald-400 font-bold flex-shrink-0">{userName}@praxis</span>
              <span className="text-slate-500 flex-shrink-0">:</span>
              <span className="text-indigo-400 flex-shrink-0">~</span>
              <span className="text-slate-500 flex-shrink-0">$</span>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none outline-none text-slate-100 caret-transparent p-0 m-0"
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                />
                {/* Custom Cursor */}
                <span
                  className={`absolute top-0 text-cyan-400 font-bold transition-opacity ${
                    showCursor ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ left: `${currentInput.length * 0.6}em` }}
                >
                  ▌
                </span>
              </div>
            </div>
          )}
        </div>



        {/* Quick Action Buttons (for mobile/lazy users) */}
        {/* Quick Action Buttons (for mobile/lazy users) */}
        <div className="flex-shrink-0 flex flex-wrap gap-3 mt-8 border-t border-slate-800 pt-6 animate-in fade-in duration-1000 slide-in-from-bottom-5">
          <button
            onClick={() => processCommand('start')}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-lg text-sm font-bold shadow-lg shadow-indigo-900/30 transition-all hover:scale-105"
          >
            ▶ 開始練習
          </button>
          <button
            onClick={() => processCommand('login')}
            className="px-6 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-all hover:scale-105"
          >
            登入帳號
          </button>
          <button
            onClick={() => processCommand('about')}
            className="px-6 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-all hover:scale-105"
          >
            關於平台
          </button>
        </div>
        </div>

        {/* System Monitor Side Panel (Desktop Only) */}
        <div className={`hidden lg:flex flex-col gap-6 lg:col-span-1 transition-opacity duration-1000 ${isWelcomeComplete ? 'opacity-100' : 'opacity-0'}`}>
          {/* Logo Section - Clean, preventing layout shift */}
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-32 h-32 relative mb-2">
              <div className="absolute inset-0 bg-indigo-500 blur-[50px] opacity-20 animate-pulse" />
              <Image 
                src="/logo.png" 
                alt="Praxis Logo"
                fill
                className="object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.6)] mix-blend-screen"
              />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent tracking-widest mt-2">PRAXIS</h3>
            <p className="text-[10px] tracking-[0.2em] text-indigo-400/80 font-bold uppercase">System Online</p>
          </div>

          {/* Stats Panel */}
          <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-lg backdrop-blur-sm space-y-4 font-mono text-xs text-slate-400">
             <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                   <Zap className="w-4 h-4 text-emerald-400" /> AI LATENCY
                </span>
                <span className="text-white">{aiLatency}ms</span>
             </div>
             <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min((aiLatency / 200) * 100, 100)}%` }} 
                />
             </div>

             <div className="flex items-center justify-between mt-2">
                <span className="flex items-center gap-2">
                   <Users className="w-4 h-4 text-cyan-400" /> LIVE LEARNERS
                </span>
                <span className="text-white">{activeUsers.toLocaleString()}</span>
             </div>
             <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min((activeUsers / 100) * 100, 100)}%` }} 
                />
             </div>

             <div className="flex items-center justify-between mt-2">
                <span className="flex items-center gap-2">
                   <Database className="w-4 h-4 text-amber-400" /> QUESTIONS
                </span>
                <span className="text-white">{totalQuestions > 0 ? totalQuestions.toLocaleString() : 'Loading...'}</span>
             </div>
             
             <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-2">
                   <Globe className="w-4 h-4 text-indigo-400" /> REGION
                </span>
                <span className="text-emerald-400">TAIWAN</span>
             </div>
          </div>
          
          <div className="text-[10px] text-slate-600 font-mono">
            <p>ID: {user.isAuthenticated ? 'USER' : 'GUEST'}-ACCESS</p>
            <p>STATUS: ONLINE</p>
          </div>
        </div>
      </div>

      {/* Floating Version Badge - Removed in favor of Footer */}
      
      <Footer />
    </div>
  );
}
