'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, ArrowRight, LogOut, Trophy, Target } from 'lucide-react';
import { getSubjects } from '@/lib/api';

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

interface Subject {
  _id: string;
  name: string;
  slug: string;
  description: string;
  language: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user profile
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem('jwt_token');
        router.push('/login');
      });

    // Fetch subjects
    getSubjects()
      .then((data) => setSubjects(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleSelectSubject = (slug: string) => {
    router.push(`/subject/${slug}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    router.push('/login');
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">TQC 題庫練習</h1>
                <p className="text-xs text-slate-400">多語言程式設計平台</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.picture} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white"
              >
                <LogOut className="h-5 w-5" />
              </Button>
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
              歡迎回來，{user.name?.split(' ')[0]}！
            </h2>
            <p className="text-slate-400 text-lg">選擇一個題庫開始練習</p>
          </div>

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
          {subjects.filter(s => !s.isActive).length === 0 && (
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
