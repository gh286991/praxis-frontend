import { Loader2, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface GenerationModalProps {
  isOpen: boolean;
  status: 'idle' | 'progress' | 'success' | 'error';
  messages: string[];
  onClose: () => void;
}

export default function GenerationModal({ isOpen, status, messages, onClose }: GenerationModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [terminalInput, setTerminalInput] = useState('');

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when modal opens and status is progress
  useEffect(() => {
    if (isOpen && status === 'progress' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, status]);

  // Handle terminal input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = terminalInput.trim().toLowerCase();
      if (command === 'stop') {
        onClose(); // Stop generation by closing the modal
      }
      setTerminalInput('');
    }
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="w-full max-w-2xl overflow-hidden bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-indigo-900/30 animate-in zoom-in-95 duration-300"
        >
          {/* Terminal Header - Mac Style */}
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
            {/* Mac Window Controls - Left Side */}
            <div className="flex gap-2">
              <div 
                onClick={onClose} 
                className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer group relative"
                title="關閉"
              >
                <span className="absolute inset-0 flex items-center justify-center text-red-900 text-[10px] opacity-0 group-hover:opacity-100 font-bold">×</span>
              </div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-not-allowed" title="最小化（不可用）"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-not-allowed" title="最大化（不可用）"></div>
            </div>
            
            {/* Title - Centered */}
            <div className="flex-1 flex items-center justify-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="font-mono text-sm font-bold text-cyan-400">
                AI 題目生成系統
              </h3>
            </div>
            
            {/* Right Spacer for balance */}
            <div className="w-[68px]"></div>
          </div>

          {/* Terminal Body */}
          <div className="p-6 space-y-4 bg-slate-900">
            {/* Status Line */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700/50">
              <div className="relative flex items-center justify-center">
                {status === 'progress' && (
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                )}
                {status === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                {status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                )}
              </div>
              <div>
                <h4 className="font-mono text-base font-bold text-slate-200">
                    {status === 'progress' ? '[執行中] 正在生成題目...' : 
                     status === 'success' ? '[完成] 生成成功' : '[錯誤] 生成失敗'}
                </h4>
                <p className="font-mono text-xs text-slate-400">
                    {status === 'progress' ? '請稍候，AI 正在為您打造專屬挑戰' : 
                     status === 'success' ? '您的挑戰已準備就緒' : '發生錯誤，請重試'}
                </p>
              </div>
            </div>

            {/* Terminal Logs Window */}
            <div className="p-4 font-mono text-sm rounded bg-black/50 border border-slate-800 max-h-64 overflow-y-auto shadow-inner scrollbar-terminal">
               <div className="flex flex-col gap-1.5">
                 {messages.map((msg, idx) => (
                   <div 
                     key={idx}
                     className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200"
                   >
                     <span className="text-slate-600 text-xs">
                       [{new Date().toLocaleTimeString('zh-TW', { hour12: false })}]
                     </span>
                     <span className={
                         msg.includes('失敗') || msg.includes('錯誤') || msg.includes('FAILED') ? 'text-rose-400' : 
                         msg.includes('通過') || msg.includes('成功') || msg.includes('完成') || msg.includes('PASSED') || msg.includes('就緒') ? 'text-emerald-400' :
                         msg.includes('生成') || msg.includes('檢查') || msg.includes('測試') || msg.includes('儲存') ? 'text-cyan-400' :
                         'text-slate-300'
                     }>
                       {msg.startsWith('>') ? msg : `> ${msg}`}
                     </span>
                   </div>
                 ))}
                 
                 {/* Terminal Input Line - Only show when in progress */}
                 {status === 'progress' && (
                   <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800/50">
                     <span className="text-cyan-400">{'>'}</span>
                     <input
                       ref={inputRef}
                       type="text"
                       value={terminalInput}
                       onChange={(e) => setTerminalInput(e.target.value)}
                       onKeyDown={handleKeyDown}
                       placeholder="輸入 'stop' 中斷生成..."
                       className="flex-1 bg-transparent border-none outline-none text-slate-300 placeholder:text-slate-600 caret-cyan-400"
                       autoComplete="off"
                       spellCheck={false}
                     />
                   </div>
                 )}
                 
                 {status === 'progress' && !terminalInput && (
                     <div className="flex gap-1 mt-1 animate-pulse text-cyan-400/70">
                       <span>{'>'}</span>
                       <span className="animate-ping">▌</span>
                     </div>
                 )}
                 <div ref={messagesEndRef} />
               </div>
            </div>
          </div>
        </div>
      </div>
  );
}
