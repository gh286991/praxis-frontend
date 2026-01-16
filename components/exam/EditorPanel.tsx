import Editor from '@monaco-editor/react';
import { Play, Loader2 } from 'lucide-react';

interface EditorPanelProps {
  code: string;
  onChange: (value: string | undefined) => void;
  onRun: () => void;
  isExecuting: boolean;
}

export function EditorPanel({ code, onChange, onRun, isExecuting }: EditorPanelProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Editor Toolbar */}
      <div className="px-6 py-3 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 flex justify-between items-center shadow-lg flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-lg shadow-cyan-500/50" />
          <span className="text-sm font-bold text-white tracking-wide">solution.py</span>
        </div>
        <button
          onClick={onRun}
          disabled={isExecuting}
          className="relative overflow-hidden group flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg shadow-xl shadow-emerald-900/30 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
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
          onChange={onChange}
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
    </div>
  );
}
