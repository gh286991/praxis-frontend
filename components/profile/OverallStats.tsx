import { Trophy, Target, Zap, Activity } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface OverallStatsProps {
  stats: any[]; // Using any[] for now as we aggregate from list of stats
}

export default function OverallStats({ stats }: OverallStatsProps) {
  // Calculate aggregates
  const totalAttempts = stats.reduce((acc, curr) => acc + curr.totalAttempts, 0);
  const totalPassed = stats.reduce((acc, curr) => acc + curr.passedCount, 0);
  const averagePassRate = stats.length > 0 
    ? Math.round(stats.reduce((acc, curr) => acc + (curr.passedCount / curr.totalAttempts || 0), 0) / stats.length * 100)
    : 0;
  
  const statsItems = [
    {
      label: "總答題數",
      value: totalAttempts,
      icon: Target,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      label: "已通過",
      value: totalPassed,
      icon: Trophy,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20"
    },
    {
      label: "平均通過率",
      value: `${averagePassRate}%`,
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      label: "參與科目",
      value: stats.length,
      icon: Zap,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statsItems.map((item, index) => (
        <Card key={index} className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className={`p-3 w-fit rounded-xl ${item.bg} ${item.border} border`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">{item.label}</p>
                <div className="text-2xl font-bold text-white">{item.value}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
