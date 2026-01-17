import { Terminal, CheckCircle2, XCircle } from 'lucide-react';

interface ConsolePanelProps {
  output: string;
  height: number;
  input?: string;
  expectedOutput?: string;
  passed?: boolean; // New prop
}

export function ConsolePanel({ output, height, input, expectedOutput, passed }: ConsolePanelProps) {
  return (
    <div 
      className="bg-slate-950/90 backdrop-blur-md border-t border-slate-700/50 flex flex-col shadow-2xl flex-shrink-0"
      style={{ height: `${height}px` }}
    >
      <div className="px-5 py-3 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 flex items-center gap-3">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-bold text-white uppercase tracking-wider">執行結果</span>
        
        {/* Pass/Fail Indicator */}
        {expectedOutput && passed !== undefined && (
           <div className={`flex items-center gap-2 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
             passed 
               ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
               : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
           }`}>
              {passed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> <span>Passed</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> <span>Failed</span>
                </>
              )}
           </div>
        )}
        
        <div className="flex-1" />
      </div>

      <div className="flex-1 overflow-auto p-6 font-mono text-[15px] custom-scrollbar bg-slate-900/50">
        {expectedOutput ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Input Section */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                Input
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300 shadow-inner whitespace-pre-wrap">
                {input}
              </div>
            </div>

            {/* Output vs Expected Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  Actual Output
                </div>
                <div className="bg-slate-950/50 p-4 rounded-lg border border-indigo-500/20 text-indigo-100 shadow-inner h-full min-h-[100px] whitespace-pre-wrap">
                  {output || <span className="text-slate-600 italic">...</span>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  Expected Output
                </div>
                <div className="bg-slate-950/50 p-4 rounded-lg border border-emerald-500/20 text-emerald-100 shadow-inner h-full min-h-[100px] whitespace-pre-wrap">
                  {expectedOutput}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <pre className="text-emerald-300 font-semibold leading-relaxed tracking-wide">
            {output || <span className="text-slate-600 italic font-normal">等待執行...</span>}
          </pre>
        )}
      </div>
    </div>
  );
}
