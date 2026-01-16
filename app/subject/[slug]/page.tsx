'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';
import { getSubjectBySlug, getCategoriesBySubject } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setCurrentSubject, setCategories, setLoading } from '@/lib/store/slices/subjectsSlice';

export default function SubjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { currentSubject: subject, categories, loading } = useAppSelector((state) => state.subjects);

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

    // Fetch subject and categories
    getSubjectBySlug(slug)
      .then((subjectData) => {
        dispatch(setCurrentSubject(subjectData));
        return getCategoriesBySubject(subjectData._id);
      })
      .then((categoriesData) => {
        dispatch(setCategories(categoriesData));
      })
      .catch(console.error)
      .finally(() => dispatch(setLoading(false)));
      
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div 
                className="p-2 rounded-xl text-2xl"
                style={{ background: subject.color }}
              >
                {subject.icon}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{subject.name}</h1>
                <p className="text-xs text-slate-400">{subject.description}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">選擇練習類別</h2>
            <p className="text-slate-400">共 {categories.length} 個類別</p>
          </div>

          {/* Category List */}
          <div className="space-y-4">
            {categories.map((category, index) => (
              <Card
                key={category._id}
                className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-indigo-900/10 cursor-pointer group"
                onClick={() => handleStartCategory(category.slug)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        style={{ background: subject.color }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-white group-hover:text-cyan-400 transition">
                          {category.name}
                        </CardTitle>
                        {category.description && (
                          <CardDescription className="text-slate-400 mt-1">
                            {category.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {!loading && categories.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">此題庫暫無類別</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
