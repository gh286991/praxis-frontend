import { Activity, CheckCircle2, Target } from 'lucide-react';
import { TerminalWindow } from '@/components/TerminalWindow';
import React from 'react';

interface SubjectStatsProps {
  stats: {
    completedQuestions: number;
    totalQuestions: number;
    passedQuestions: number;
    failedQuestions: number;
    totalSubmissions?: number;
    totalPassedSubmissions?: number;
  } | null;
}

export function SubjectStats({ stats }: SubjectStatsProps) {
  if (!stats || stats.totalQuestions === 0) {
    return (
      <TerminalWindow title="系統診斷">
        <div className="flex flex-col items-center justify-center py-8 opacity-50 space-y-2">
          <Activity className="w-8 h-8 text-slate-600" />
          <p className="text-xs text-slate-500 font-mono">無可用數據 / NO DATA</p>
        </div>
      </TerminalWindow>
    );
  }

  // Calculate Accuracy
  const totalSubmissions = stats.totalSubmissions || 0;
  const passedSubmissions = stats.totalPassedSubmissions || 0;
  const accuracy = totalSubmissions > 0 
    ? Math.round((passedSubmissions / totalSubmissions) * 100) 
    : 0;

  // Calculate Completion
  const completionRate = Math.round(
    (stats.passedQuestions / Math.max(stats.totalQuestions, 1)) * 100
  );

  return (
    <TerminalWindow title="系統診斷">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 text-emerald-400 border-b border-emerald-500/20 pb-2">
          <Activity className="w-4 h-4" />
          <h3 className="text-xs font-bold tracking-widest uppercase font-mono">
            System Diagnostics
          </h3>
        </div>

        {/* Main Metrics: Accuracy & Completion */}
        <div className="grid grid-cols-2 gap-4">
          {/* Accuracy Metric */}
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target className="w-12 h-12 text-emerald-400" />
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" />
              程式準確率
            </div>
            <div className="text-2xl font-light text-emerald-400 font-mono">
              {accuracy}%
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
               <div 
                 className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                 style={{ width: `${accuracy}%` }}
               />
            </div>
          </div>

          {/* Completion Metric */}
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 className="w-12 h-12 text-cyan-400" />
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              完成進度
            </div>
            <div className="text-2xl font-light text-cyan-400 font-mono">
              {completionRate}%
            </div>
             <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
               <div 
                 className="h-full bg-cyan-500 transition-all duration-1000 ease-out"
                 style={{ width: `${completionRate}%` }}
               />
            </div>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/30 p-2 border border-slate-800 rounded text-center">
                <div className="text-[10px] text-slate-600 uppercase mb-1">總題數</div>
                <div className="text-lg text-slate-300 font-mono">{stats.totalQuestions}</div>
            </div>
            <div className="bg-slate-900/30 p-2 border border-slate-800 rounded text-center">
                <div className="text-[10px] text-slate-600 uppercase mb-1">已解決</div>
                <div className="text-lg text-slate-300 font-mono">{stats.passedQuestions}</div>
            </div>
             <div className="bg-slate-900/30 p-2 border border-slate-800 rounded text-center">
                <div className="text-[10px] text-slate-600 uppercase mb-1">總提交</div>
                <div className="text-lg text-slate-300 font-mono">{totalSubmissions}</div>
            </div>
        </div>

        {/* Footer / Status */}
        <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono border-t border-slate-800 pt-2">
            <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SYSTEM ONLINE
            </span>
            <span>ID: SYSDIAG-001</span>
        </div>
      </div>
    </TerminalWindow>
  );
}
