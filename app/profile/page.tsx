'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/lib/store';
import { getAllStats } from '@/lib/api';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpRight, ChevronLeft } from 'lucide-react';

interface SubjectStat {
  subjectTitle: string;
  subjectSlug: string;
  totalAttempts: number;
  passedCount: number;
}

export default function ProfilePage() {
  const { profile: user, isAuthenticated } = useAppSelector((state) => state.user);
  const [stats, setStats] = useState<SubjectStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      const data = await getAllStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregates with proper fallbacks
  const totalAttempts = stats.reduce((acc, curr) => acc + (curr.totalAttempts || 0), 0);
  const totalPassed = stats.reduce((acc, curr) => acc + (curr.passedCount || 0), 0);
  const overallPassRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0;

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-zinc-500">請先登入</p>
          <Link href="/login" className="text-white underline underline-offset-4 hover:text-zinc-300">
            前往登入
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Simple Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            返回儀表板
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        
        {/* Profile Header - Clean & Simple */}
        <section className="mb-16">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20 border-2 border-zinc-800">
              <AvatarImage src={user?.picture} alt={user?.name} />
              <AvatarFallback className="text-2xl bg-zinc-800 text-zinc-300">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {user?.name || 'User'}
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                {user?.email}
              </p>
            </div>
          </div>
        </section>

        {/* Stats - Typography Focused, No Icons */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-6">
            概覽
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-light tabular-nums">{totalAttempts}</div>
              <div className="text-sm text-zinc-500 mt-2">總練習</div>
            </div>
            <div>
              <div className="text-4xl font-light tabular-nums text-emerald-400">{totalPassed}</div>
              <div className="text-sm text-zinc-500 mt-2">已通過</div>
            </div>
            <div>
              <div className="text-4xl font-light tabular-nums">{totalAttempts - totalPassed}</div>
              <div className="text-sm text-zinc-500 mt-2">未通過</div>
            </div>
            <div>
              <div className="text-4xl font-light tabular-nums">{overallPassRate}<span className="text-xl">%</span></div>
              <div className="text-sm text-zinc-500 mt-2">通過率</div>
            </div>
          </div>
        </section>

        {/* Subject Progress - Minimal List */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-6">
            科目進度
          </h2>

          {stats.length > 0 ? (
            <div className="space-y-1">
              {stats.map((stat) => {
                const passRate = stat.totalAttempts > 0 
                  ? Math.round((stat.passedCount / stat.totalAttempts) * 100) 
                  : 0;

                return (
                  <Link 
                    key={stat.subjectSlug} 
                    href={`/subject/${stat.subjectSlug}`}
                    className="group flex items-center justify-between py-4 border-b border-zinc-800/50 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-400">
                        {stat.subjectTitle?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <div className="font-medium group-hover:text-zinc-300 transition-colors">
                          {stat.subjectTitle}
                        </div>
                        <div className="text-sm text-zinc-600">
                          {stat.totalAttempts} 次練習
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm">
                          <span className="text-emerald-400">{stat.passedCount}</span>
                          <span className="text-zinc-600"> / {stat.totalAttempts}</span>
                        </div>
                        <div className="text-xs text-zinc-600">{passRate}% 通過</div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden hidden md:block">
                        <div 
                          className="h-full bg-zinc-500 rounded-full"
                          style={{ width: `${passRate}%` }}
                        />
                      </div>
                      
                      <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-zinc-600 mb-4">尚無練習紀錄</p>
              <Link 
                href="/dashboard" 
                className="text-sm text-white underline underline-offset-4 hover:text-zinc-300"
              >
                開始練習
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
