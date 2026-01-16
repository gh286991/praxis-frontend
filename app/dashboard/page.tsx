'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Clock, Trophy, User, LogOut } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

interface ExamType {
  id: string;
  title: string;
  description: string;
  level: number;
  questionCount: number;
  timeLimit: number;
  icon: React.ReactNode;
  color: string;
}

const examTypes: ExamType[] = [
  {
    id: 'category1',
    title: '第1類：基本程式設計',
    description: '程式語言基本概念、輸入輸出',
    level: 1,
    questionCount: 10,
    timeLimit: 30,
    icon: <BookOpen className="w-6 h-6" />,
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
  },
  {
    id: 'category2',
    title: '第2類：選擇敘述',
    description: 'if/elif/else 條件判斷',
    level: 1,
    questionCount: 10,
    timeLimit: 30,
    icon: <BookOpen className="w-6 h-6" />,
    color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
  },
  {
    id: 'category3',
    title: '第3類：迴圈敘述',
    description: 'for/while 迴圈',
    level: 1,
    questionCount: 10,
    timeLimit: 30,
    icon: <BookOpen className="w-6 h-6" />,
    color: 'bg-gradient-to-br from-teal-500 to-teal-600',
  },
  {
    id: 'category4',
    title: '第4類：進階控制流程',
    description: 'break、continue、巢狀結構',
    level: 2,
    questionCount: 8,
    timeLimit: 35,
    icon: <Trophy className="w-6 h-6" />,
    color: 'bg-gradient-to-br from-green-500 to-green-600',
  },
  {
    id: 'category5',
    title: '第5類：函式(Function)',
    description: '函式定義、參數、回傳值',
    level: 2,
    questionCount: 8,
    timeLimit: 35,
    icon: <Trophy className="w-6 h-6" />,
    color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  },
  {
    id: 'category6',
    title: '第6類：串列(List)的運作',
    description: '一維、二維串列操作',
    level: 2,
    questionCount: 8,
    timeLimit: 35,
    icon: <Trophy className="w-6 h-6" />,
    color: 'bg-gradient-to-br from-lime-500 to-lime-600',
  },
  {
    id: 'category7',
    title: '第7類：數組、集合、字典',
    description: 'Tuple、Set、Dict 運作',
    level: 2,
    questionCount: 8,
    timeLimit: 40,
    icon: <Trophy className="w-6 h-6" />,
    color: 'bg-gradient-to-br from-amber-500 to-amber-600',
  },
  {
    id: 'category8',
    title: '第8類：字串(String)的運作',
    description: '字串處理與操作',
    level: 2,
    questionCount: 8,
    timeLimit: 35,
    icon: <Trophy className="w-6 h-6" />,
    color: 'bg-gradient-to-br from-orange-500 to-orange-600',
  },
  {
    id: 'category9',
    title: '第9類：檔案與異常處理',
    description: '檔案讀寫、例外處理',
    level: 3,
    questionCount: 6,
    timeLimit: 40,
    icon: <Trophy className="w-6 h-6" />,
    color: 'bg-gradient-to-br from-red-500 to-red-600',
  },
];

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }

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
  }, [router]);

  const handleStartExam = (examId: string) => {
    // TODO: Navigate to exam page
    router.push(`/exam/${examId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    router.push('/login');
  };

  if (!user) {
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
                <h1 className="text-xl font-bold text-white">TQC Python</h1>
                <p className="text-xs text-slate-400">考試準備平台</p>
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
            <p className="text-slate-400 text-lg">選擇一個考試類型開始練習</p>
          </div>

          {/* Exam Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {examTypes.map((exam) => (
              <Card
                key={exam.id}
                className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600 transition-all hover:shadow-xl hover:shadow-indigo-900/20"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`${exam.color} p-3 rounded-xl shadow-lg`}>
                      {exam.icon}
                    </div>
                    <div className="px-3 py-1 bg-slate-700/50 rounded-full">
                      <span className="text-xs font-bold text-slate-300">Level {exam.level}</span>
                    </div>
                  </div>
                  <CardTitle className="text-white mt-4">{exam.title}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {exam.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>{exam.questionCount} 題</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>{exam.timeLimit} 分鐘</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleStartExam(exam.id)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500"
                  >
                    開始考試
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <Trophy className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-sm text-slate-400">已完成考試</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <BookOpen className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-sm text-slate-400">答對題數</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <User className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">-</p>
                    <p className="text-sm text-slate-400">平均分數</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
