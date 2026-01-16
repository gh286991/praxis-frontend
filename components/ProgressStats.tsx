import React from 'react';
import { ProgressStats as IProgressStats } from '../lib/store/slices/subjectsSlice';
import { TrendingUp, CheckCircle, XCircle, Target, Trophy } from 'lucide-react';

interface Props {
  stats: IProgressStats | null;
  title?: string;
  className?: string;
  loading?: boolean;
}

export const ProgressStats: React.FC<Props> = ({ 
  stats, 
  title = "學習概況", 
  className = "",
  loading = false
}) => {
  if (loading) {
    return (
      <div className={`bg-slate-900/50 border border-slate-800 rounded-2xl p-6 animate-pulse ${className}`}>
        <div className="h-6 w-32 bg-slate-800 rounded mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: '總答題數',
      value: stats.completedQuestions,
      icon: Target,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    {
      label: '答對題數',
      value: stats.passedQuestions,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    {
      label: '通過率',
      value: `${Math.round(stats.passRate)}%`,
      icon: Trophy,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
    {
      label: '待加強',
      value: stats.failedQuestions,
      icon: XCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20'
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          {title}
        </h3>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <div 
            key={idx}
            className={`p-4 rounded-xl border ${card.border} ${card.bg} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{card.label}</span>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className={`text-2xl font-bold text-white tracking-tight`}>
                {card.value}
              </div>
            </div>
            {/* Hover Effect Background */}
            <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 bg-slate-800/50 rounded-full h-3 overflow-hidden border border-slate-700/50 relative">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          style={{ width: `${stats.passRate}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 px-1 mt-1">
        <span>0%</span>
        <span>通過率</span>
        <span>100%</span>
      </div>
    </div>
  );
};
