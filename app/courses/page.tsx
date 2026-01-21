'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Trophy, Target, LayoutDashboard, Terminal } from 'lucide-react';
import { getSubjects } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setUser, logout } from '@/lib/store/slices/userSlice';
import { setSubjects, setLoading, fetchAllStats } from '@/lib/store/slices/subjectsSlice';
import { ProgressStats } from '@/components/ProgressStats';
import { Footer } from '@/components/landing/Footer';
import { CyberpunkBackground } from '@/components/CyberpunkBackground'; // Import Footer
import { AppNavbar } from '@/components/AppNavbar';

export default function CoursesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const user = useAppSelector((state) => state.user.profile);
  const { subjects, loading, stats } = useAppSelector((state) => state.subjects);


  useEffect(() => {
    // Cookie is handled by browser, just try to fetch profile
    if (!user) {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/users/profile`, {
        credentials: 'include',
        })
        .then((res) => {
            if (res.ok) return res.json();
            throw new Error('Unauthorized');
        })
        .then((data) => dispatch(setUser(data)))
        .catch(() => {
            dispatch(logout());
            router.push('/login');
        });
    }

    // Fetch subjects
    if (subjects.length === 0) {
        dispatch(setLoading(true));
    }
    
    getSubjects()
      .then((data) => dispatch(setSubjects(data)))
      .catch(console.error)
      .finally(() => dispatch(setLoading(false)));

    // Fetch stats
    dispatch(fetchAllStats());

  }, [router, dispatch, user, subjects.length]);

  const overallStats = useMemo(() => {
    if (!stats || stats.length === 0) return null;
    
    const initial = {
      totalQuestions: 0,
      completedQuestions: 0,
      passedQuestions: 0,
      failedQuestions: 0,
      completionRate: 0,
      passRate: 0
    };

    const aggregated = stats.reduce((acc, curr) => ({
      totalQuestions: acc.totalQuestions + curr.totalQuestions,
      completedQuestions: acc.completedQuestions + curr.completedQuestions,
      passedQuestions: acc.passedQuestions + curr.passedQuestions,
      failedQuestions: acc.failedQuestions + curr.failedQuestions,
      completionRate: 0,
      passRate: 0,
    }), initial);

    // Recalculate rates
    aggregated.completionRate = aggregated.totalQuestions > 0 
      ? (aggregated.completedQuestions / aggregated.totalQuestions) * 100 
      : 0;
    aggregated.passRate = aggregated.completedQuestions > 0 
      ? (aggregated.passedQuestions / aggregated.completedQuestions) * 100 
      : 0;

    return aggregated;
  }, [stats]);

  const handleSelectSubject = (slug: string) => {
    router.push(`/subject/${slug}`);
  };

  if (!user && loading) { // Show loading only if no user AND loading (initial load)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-mono">
        <div className="text-indigo-400 animate-pulse">正在載入課程...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono relative flex flex-col selection:bg-indigo-500/30">
      <CyberpunkBackground />
      
      <AppNavbar />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 relative z-20 flex-1">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
            <div className="space-y-2">
               <div className="flex items-center gap-2 text-indigo-400 mb-1">
                   <Terminal className="w-4 h-4" />
                   <span className="text-xs tracking-widest uppercase font-bold">Session Active</span>
               </div>
               <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                歡迎回來，<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">{user ? user.name : 'Unknown User'}</span>
               </h2>
               <p className="text-slate-400 text-sm md:text-base max-w-xl">
                 系統已準備就緒。請選擇下方的訓練模組以開始您的程式技能測驗。
               </p>
            </div>
            
            <div className="flex gap-4">
                 <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-lg backdrop-blur-sm text-center min-w-[120px]">
                    <div className="text-2xl font-bold text-white">{subjects.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">可用題庫</div>
                 </div>
                 <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-lg backdrop-blur-sm text-center min-w-[120px]">
                     <div className="text-2xl font-bold text-green-400">{loading ? '-' : 'ONLINE'}</div>
                     <div className="text-[10px] text-slate-500 uppercase tracking-wider">系統狀態</div>
                 </div>
            </div>
          </div>
          
          {/* Subject Cards */}
          <div>
              <div className="flex items-center gap-2 mb-6">
                  <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-lg font-bold text-slate-200 tracking-wider">課程列表</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject, idx) => (
                  <Card
                    key={subject._id}
                    className="bg-slate-900/40 border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] cursor-pointer group backdrop-blur-sm relative overflow-hidden"
                    onClick={() => handleSelectSubject(subject.slug)}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-cyan-500/0 group-hover:from-indigo-500/10 group-hover:to-cyan-500/10 transition-all duration-500" />
                    
                    <CardHeader className="relative z-10">
                      <div className="flex items-start justify-between">
                        <div 
                          className="p-3 rounded-lg shadow-lg text-3xl ring-1 ring-white/10"
                          style={{ background: subject.color }}
                        >
                          {subject.icon}
                        </div>
                        {subject.isActive && (
                          <div className="px-2 py-0.5 bg-green-500/10 rounded border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                            <span className="text-[10px] font-bold text-green-400 tracking-wider">ACTIVE</span>
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-slate-100 mt-4 text-xl group-hover:text-cyan-300 transition-colors font-bold tracking-tight">
                        {subject.name}
                      </CardTitle>
                      <CardDescription className="text-slate-400/80 text-xs leading-relaxed line-clamp-2 min-h-[2.5em]">
                        {subject.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 relative z-10">
                      <div className="h-px w-full bg-slate-800/80" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase">
                          <Target className="w-3 h-3 text-indigo-400" />
                          <span>{subject.language}</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white transition-all duration-300 group/btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSubject(subject.slug);
                        }}
                      >
                        <span className="mr-2 text-xs font-bold tracking-widest">ACCESS MODULE</span>
                        <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          {/* Placeholder for inactive subjects */}
          {!loading && subjects.length === 0 && (
             <div className="text-center py-20 border border-dashed border-slate-800 rounded-lg bg-slate-900/20">
               <p className="text-slate-500 text-sm font-mono typewriter">Searching for training data...</p>
             </div>
          )}
          
          {!loading && subjects.length > 0 && subjects.filter(s => !s.isActive).length === 0 && (
            <div className="text-center py-12 opacity-50">
              <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-600 text-xs uppercase tracking-widest">More modules under development...</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
