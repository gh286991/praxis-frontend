'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';
import { getSubjectBySlug, getCategoriesBySubject } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setCurrentSubject, setCategories, setLoading, fetchSubjectStats } from '@/lib/store/slices/subjectsSlice';
import { ProgressStats } from '@/components/ProgressStats';

export default function SubjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { currentSubject: subject, categories, loading, currentSubjectStats } = useAppSelector((state) => state.subjects);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Set loading true initially if no subject or slug changed
    if (!subject || subject.slug !== slug) {
       dispatch(setLoading(true));
    }

    // Fetch subject, categories, and stats
    const fetchData = async () => {
      try {
        const subjectData = await getSubjectBySlug(slug);
        dispatch(setCurrentSubject(subjectData));
        
        const [categoriesData] = await Promise.all([
          getCategoriesBySubject(subjectData._id),
          dispatch(fetchSubjectStats(slug))
        ]);
        
        dispatch(setCategories(categoriesData));
      } catch (error) {
        console.error(error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchData();
      
    // Cleanup? Maybe clear current subject on unmount?
    // For now, keeping it is fine, it caches the last viewed subject.
  }, [slug, router, dispatch]);

  const handleStartCategory = (categorySlug: string) => {
    router.push(`/exam/${slug}/${categorySlug}`);
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if ((loading && !subject) || !subject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/grid-pattern.svg')] bg-fixed bg-slate-950 text-slate-200">
        <div className="fixed inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950 pointer-events-none" />
        
        {/* Decorative Background Elements */}
        <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-white/5 bg-slate-950/50 backdrop-blur-xl z-50 sticky top-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="text-slate-400 hover:text-white hover:bg-white/5 rounded-full"
                >
                <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <div className="h-8 w-[1px] bg-white/10 mx-2" />

                <div className="flex items-center gap-3">
                    <div 
                        className="p-2 rounded-lg text-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        style={{ background: `linear-gradient(135deg, ${subject.color}, transparent)` }}
                    >
                        {subject.icon}
                    </div>
                    <span className="font-bold text-lg tracking-wide text-white">{subject.name}</span>
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-6 py-12 z-10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Hero / Stats Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                    選擇練習類別
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                    請選擇一個主題開始您的練習。每個類別都包含多個精選題目，幫助您循序漸進地掌握 {subject.name} 的核心概念。
                </p>
                <div className="flex items-center gap-4 pt-4">
                    <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium">
                        {categories.length} 個章節
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium">
                        Python 3.10+
                    </div>
                </div>
            </div>

            {/* Stats Card */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full shadow-2xl">
                    {currentSubjectStats && (currentSubjectStats.completedQuestions > 0) ? (
                        <ProgressStats stats={currentSubjectStats} title="學習概況" className="h-full justify-center flex flex-col" />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-4">
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-slate-500" />
                            </div>
                            <h3 className="text-white font-medium">尚未開始練習</h3>
                            <p className="text-sm text-slate-500">完成題目後將在此顯示您的學習數據</p>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div
                key={category._id}
                onClick={() => handleStartCategory(category.slug)}
                className="group relative cursor-pointer"
              >
                {/* Glow Effect */}
                <div 
                    className="absolute inset-x-4 bottom-0 h-2 bg-gradient-to-r from-indigo-500 to-cyan-500 blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500" 
                />
                
                <Card className="relative h-full bg-slate-900/40 border-slate-800/60 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden backdrop-blur-sm shadow-lg group-hover:-translate-y-1">
                  
                  {/* Decorative Gradient Overlay */}
                  <div className="absolute top-0 right-0 p-20 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />

                  <CardHeader className="relative p-6 z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 border border-white/5 text-slate-300 font-mono font-bold text-sm shadow-inner group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition-colors">
                            {(index + 1).toString().padStart(2, '0')}
                        </div>
                        <div className="p-2 rounded-full bg-slate-800/50 text-slate-500 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>

                    <CardTitle className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-300 group-hover:to-cyan-300 transition-all">
                      {category.name}
                    </CardTitle>
                    
                    <CardDescription className="text-slate-400 line-clamp-2 leading-relaxed">
                      {category.description || `練習 ${category.name} 相關的程式設計概念與技巧。`}
                    </CardDescription>
                  </CardHeader>
                  
                  {/* Bottom Highlight */}
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-indigo-500 to-cyan-500 group-hover:w-full transition-all duration-500 ease-out" />
                </Card>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {!loading && categories.length === 0 && (
            <div className="text-center py-20 rounded-3xl bg-slate-900/30 border border-dashed border-slate-800">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20" />
                <BookOpen className="relative w-16 h-16 text-slate-600 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">此題庫暫無類別</h3>
              <p className="text-slate-500 text-lg">更多內容即將上線</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
