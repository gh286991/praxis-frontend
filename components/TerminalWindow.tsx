import { Terminal } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * TerminalWindow - Reusable terminal-style container
 * Provides consistent terminal window styling with title bar controls
 */

interface TerminalWindowProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function TerminalWindow({ 
  title = "Terminal", 
  children, 
  className = "" 
}: TerminalWindowProps) {
  return (
    <div className={`bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden ${className}`}>
      {/* Terminal Header */}
      <div className="px-6 py-3 bg-slate-800/90 border-b border-slate-700/50 flex items-center gap-3">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Terminal className="w-4 h-4 text-slate-500 mr-2" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{title}</span>
        </div>
      </div>
      
      {/* Terminal Body */}
      <div className="p-8 md:p-12">
        {children}
      </div>
    </div>
  );
}
