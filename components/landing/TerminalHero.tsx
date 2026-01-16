'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

const ASCII_LOGO = `
██████╗ ██████╗  █████╗ ██╗  ██╗██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗██╔╝██║██╔════╝
██████╔╝██████╔╝███████║ ╚███╔╝ ██║███████╗
██╔═══╝ ██╔══██╗██╔══██║ ██╔██╗ ██║╚════██║
██║     ██║  ██║██║  ██║██╔╝ ██╗██║███████║
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝
`;

const WELCOME_TEXT = [
  '> System initialized...',
  '> Loading Praxis AI Learning Environment...',
  '> Connection established.',
  '',
  '歡迎來到 Praxis',
  'AI 驅動的程式測驗平台',
  '',
  '輸入 help 查看可用指令，或直接輸入 start 開始練習。',
];

const HELP_TEXT = [
  '',
  '可用指令:',
  '  start    - 開始練習 (前往儀表板)',
  '  login    - 登入帳號',
  '  about    - 關於本平台',
  '  clear    - 清除畫面',
  '  demo     - 執行範例程式碼',
  '',
];

const ABOUT_TEXT = [
  '',
  '╔══════════════════════════════════════════════════════════════╗',
  '║  Praxis - AI-Powered Exam Platform                           ║',
  '║  ──────────────────────────────────────────────────────────  ║',
  '║  • AI 驅動題目生成 - 無限練習題庫                              ║',
  '║  • 即時程式執行 - 在瀏覽器中運行程式碼                          ║',
  '║  • 進度追蹤 - 記錄您的學習歷程與統計                           ║',
  '║  • 多語言支援 - Python, JavaScript 等                         ║',
  '╚══════════════════════════════════════════════════════════════╝',
  '',
];

export function TerminalHero() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [displayedLogo, setDisplayedLogo] = useState('');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isLogoComplete, setIsLogoComplete] = useState(false);
  const [isWelcomeComplete, setIsWelcomeComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Ensure client-side only rendering to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
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
        setDisplayedLogo((prev) => prev + logoChars[i]);
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
  }, [terminalLines]);

  // Focus input when ready
  useEffect(() => {
    if (isWelcomeComplete && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isWelcomeComplete]);

  const processCommand = (cmd: string) => {
    const command = cmd.toLowerCase().trim();
    setTerminalLines((prev) => [...prev, `> ${cmd}`]);

    switch (command) {
      case 'start': {
        const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
        if (token) {
          setTerminalLines((prev) => [...prev, '> 正在載入儀表板...']);
          setTimeout(() => router.push('/dashboard'), 800);
        } else {
          setTerminalLines((prev) => [
            ...prev,
            '',
            '⚠️  您尚未登入',
            '請先輸入 login 登入您的帳號，或使用 Google 快速登入。',
            '',
          ]);
        }
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
      className="relative w-full h-screen bg-slate-950 overflow-hidden font-mono cursor-text"
      onClick={handleTerminalClick}
    >
      {/* CRT Scanline Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] z-50" />
      
      {/* Vignette Effect */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-40" />

      {/* Glowing Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-[120px]" />

      {/* Terminal Container */}
      <div className="relative z-10 h-full flex flex-col p-6 md:p-12 overflow-hidden">
        {/* ASCII Logo */}
        <div className="flex-shrink-0 mb-6">
          <pre className="text-[0.4rem] sm:text-[0.55rem] md:text-xs lg:text-sm text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 whitespace-pre leading-tight font-bold select-none drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            {displayedLogo}
            {!isLogoComplete && <span className="text-cyan-400">▌</span>}
          </pre>
        </div>

        {/* Terminal Output */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-4"
        >
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

        {/* Input Line */}
        {isWelcomeComplete && (
          <div className="flex-shrink-0 flex items-center gap-2 mt-4 text-sm md:text-base">
            <span className="text-emerald-400 font-bold">guest@praxis</span>
            <span className="text-slate-500">:</span>
            <span className="text-indigo-400">~</span>
            <span className="text-slate-500">$</span>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none outline-none text-slate-100 caret-transparent"
                autoComplete="off"
                spellCheck={false}
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

        {/* Quick Action Buttons (for mobile/lazy users) */}
        {isWelcomeComplete && (
          <div className="flex-shrink-0 flex flex-wrap gap-3 mt-8 border-t border-slate-800 pt-6">
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
        )}
      </div>

      {/* Floating Version Badge */}
      <div className="absolute bottom-4 right-4 text-xs text-slate-600 z-20">
        v1.0.0 | Powered by AI
      </div>
    </div>
  );
}
