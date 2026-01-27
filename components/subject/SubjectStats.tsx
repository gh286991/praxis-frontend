import { BarChart2, Activity } from 'lucide-react';
import { TerminalWindow } from '@/components/TerminalWindow';
import React from 'react';

interface SubjectStatsProps {
  stats: {
    completedQuestions: number;
    totalQuestions: number;
  } | null;
}

export function SubjectStats({ stats }: SubjectStatsProps) {
  return (
    <TerminalWindow title="系統診斷">
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-emerald-400 border-b border-emerald-500/20 pb-2">
          <BarChart2 className="w-4 h-4" />
          <h3 className="text-xs font-bold tracking-widest uppercase">進度指標</h3>
        </div>

        {stats && stats.completedQuestions > 0 ? (
          <div className="space-y-4">
            <div className="bg-slate-900/50 p-4 rounded border border-slate-700/50">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] text-slate-500 uppercase">完成度</span>
                <span className="text-xl font-light text-cyan-400">
                  {Math.round(
                    (stats.completedQuestions / Math.max(stats.totalQuestions, 1)) * 100
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500"
                  style={{
                    width: `${(stats.completedQuestions / Math.max(stats.totalQuestions, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <div className="text-[10px] text-slate-500 uppercase mb-1">已解決</div>
                <div className="text-lg font-mono text-white">{stats.completedQuestions}</div>
              </div>
              <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50">
                <div className="text-[10px] text-slate-500 uppercase mb-1">總題數</div>
                <div className="text-lg font-mono text-slate-400">{stats.totalQuestions}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 opacity-50">
            <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">無可用數據</p>
          </div>
        )}
      </div>
    </TerminalWindow>
  );
}
