// import { Progress } from "@/components/ui/progress";
import { ArrowRight, Code } from 'lucide-react';
import Link from 'next/link';

interface SubjectProgressCardProps {
  stat: any; // SubjectStats type
}

export default function SubjectProgressCard({ stat }: SubjectProgressCardProps) {
  // Calculate specific pass rate for this subject to avoid division by zero
  const passRate = stat.totalAttempts > 0 
    ? Math.round((stat.passedCount / stat.totalAttempts) * 100) 
    : 0;

  return (
    <div className="group relative bg-slate-900/40 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-800/60 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 group-hover:border-indigo-500/30 transition-colors">
              <Code className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                {stat.subjectTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {stat.totalAttempts} 次練習紀錄
              </p>
            </div>
          </div>
          
          <Link 
            href={`/subject/${stat.subjectSlug}`}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-800/50">
          <div>
            <span className="text-xs text-slate-500">已通過</span>
            <div className="text-lg font-mono font-medium text-emerald-400">
              {stat.passedCount}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500">未通過</span>
            <div className="text-lg font-mono font-medium text-rose-400">
              {stat.totalAttempts - stat.passedCount}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">通過率</span>
            <span className="text-indigo-400 font-medium">{passRate}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500 ease-in-out"
              style={{ width: `${passRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
