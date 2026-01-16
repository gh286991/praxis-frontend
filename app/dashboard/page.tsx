'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, ArrowRight, LogOut, Trophy, Target } from 'lucide-react';
import { getSubjects } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setUser, logout } from '@/lib/store/slices/userSlice';
import { setSubjects, setLoading, fetchAllStats } from '@/lib/store/slices/subjectsSlice';
import { ProgressStats } from '@/components/ProgressStats';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const user = useAppSelector((state) => state.user.profile);
  const { subjects, loading, stats } = useAppSelector((state) => state.subjects);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user profile if not present
    if (!user) {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/users/profile`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        })
        .then((res) => {
            if (res.ok) return res.json();
            throw new Error('Unauthorized');
        })
        .then((data) => dispatch(setUser(data)))
        .catch(() => {
            localStorage.removeItem('jwt_token');
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

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    dispatch(logout());
    router.push('/login');
  };

  if (!user && loading) { // Show loading only if no user AND loading (initial load)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // If we have user but loading subjects, we can still show skeleton or just the header
  // For simplicity, sticking to simple check. 
  // If user is null but not loading, it means redirect happened or error.

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="Praxis Logo" 
                className="w-10 h-10 rounded-xl"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Praxis</h1>
                <p className="text-xs text-slate-400">AI 程式測驗平台</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                  <>
                  <div className="flex items-center gap-3">
                    <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                      <Avatar className="h-10 w-10 border border-slate-700 group-hover:border-indigo-500 transition-colors">
                        <AvatarImage src={user.picture} alt={user.name} />
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </Link>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-white"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                  </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold text-white">
              歡迎回來{user ? `，${(user.name || 'User').split(' ')[0]}` : ''}！
            </h2>
            <p className="text-slate-400 text-lg">選擇一個題庫開始練習</p>
          </div>
          
          {/* Overall Stats */}
          {overallStats && (overallStats.completedQuestions > 0) && (
             <div className="max-w-4xl mx-auto">
                <ProgressStats stats={overallStats} title="總體學習概況" />
             </div>
          )}

          {/* Subject Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Card
                key={subject._id}
                className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600 transition-all hover:shadow-xl hover:shadow-indigo-900/20 cursor-pointer group"
                onClick={() => handleSelectSubject(subject.slug)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div 
                      className="p-4 rounded-xl shadow-lg text-4xl"
                      style={{ background: subject.color }}
                    >
                      {subject.icon}
                    </div>
                    {subject.isActive && (
                      <div className="px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                        <span className="text-xs font-bold text-green-400">啟用中</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-white mt-4 group-hover:text-cyan-400 transition">
                    {subject.name}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {subject.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Target className="w-4 h-4 text-indigo-400" />
                      <span className="capitalize">{subject.language}</span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 group">
                    查看題目
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Placeholder for inactive subjects */}
          {!loading && subjects.length === 0 && (
             <div className="text-center py-12">
               <p className="text-slate-500 text-lg">載入中或無可用題庫...</p>
             </div>
          )}
          
          {!loading && subjects.length > 0 && subjects.filter(s => !s.isActive).length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">更多題庫即將推出...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
