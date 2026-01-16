import { Terminal } from 'lucide-react';

interface ConsolePanelProps {
  output: string;
  height: number;
}

export function ConsolePanel({ output, height }: ConsolePanelProps) {
  return (
    <div 
      className="bg-gradient-to-b from-black to-slate-950 border-t border-slate-700/50 flex flex-col shadow-2xl flex-shrink-0"
      style={{ height: `${height}px` }}
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
  );
}
