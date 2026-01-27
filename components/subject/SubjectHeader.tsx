import { Shield, Cpu } from 'lucide-react';
import React from 'react';

interface SubjectHeaderProps {
  subject: {
    name: string;
  };
  chaptersCount: number;
  examsCount: number;
  children?: React.ReactNode;
}

export function SubjectHeader({ subject, chaptersCount, examsCount, children }: SubjectHeaderProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-700/50 p-4 md:p-6 rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Shield className="w-24 h-24 text-indigo-500" />
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Cpu className="w-3 h-3" />
          工作中模組
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-indigo-200 tracking-tight mb-2">
          {subject.name}
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
          系統已載入 <span className="text-cyan-400 font-bold">{subject.name}</span> 題庫模組。
          目前共有 <span className="text-white font-bold">{chaptersCount}</span> 個學習單元
          {examsCount > 0 && (
            <span>
              {' '}
              及 <span className="text-rose-400 font-bold">{examsCount}</span> 個模擬試題
            </span>
          )}
          可供存取。 請選擇下方單元以啟動練習程序。
        </p>
      </div>

      {children}
    </div>
  );
}
