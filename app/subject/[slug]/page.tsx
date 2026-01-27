'use client';

import { Activity } from 'lucide-react';
import { CyberpunkBackground } from '@/components/CyberpunkBackground';
import { AppNavbar } from '@/components/AppNavbar';
import { Footer } from '@/components/landing/Footer';
import { useSubjectData } from '@/hooks/useSubjectData';
import { SubjectHeader } from '@/components/subject/SubjectHeader';
import { SubjectStats } from '@/components/subject/SubjectStats';
import { CategoryList } from '@/components/subject/CategoryList';
import { ImportExamDialog } from '@/components/subject/ImportExamDialog';
import { use } from 'react';

export default function SubjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { router, dispatch, subject, chapters, exams, loading, stats } =
    useSubjectData(params);

  if ((loading && !subject) || !subject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-mono relative overflow-hidden">
        <CyberpunkBackground />
        <div className="relative z-10 text-center space-y-4">
          <div className="text-cyan-400 font-bold text-xl animate-pulse flex items-center gap-2 justify-center">
            <Activity className="w-5 h-5 animate-spin" />
            <span>資料載入中...</span>
          </div>
          <div className="w-64 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-cyan-500 animate-progress" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono selection:bg-indigo-500/30 relative overflow-hidden flex flex-col">
      <CyberpunkBackground />

      <AppNavbar />

      {/* Main Content */}
      <main className="relative container mx-auto px-6 py-12 z-20 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Header / Info Panel */}
            <div className="lg:col-span-12">
              <SubjectHeader
                subject={subject}
                chaptersCount={chapters.length}
                examsCount={exams.length}
              >
                {/* Import Button absolute positioned */}
                <div className="absolute bottom-6 right-6 z-20">
                  <ImportExamDialog subjectId={subject._id} dispatch={dispatch} />
                </div>
              </SubjectHeader>
            </div>

            {/* Left Column: Stats */}
            <div className="lg:col-span-4 space-y-6">
              <SubjectStats stats={stats} />
            </div>

            {/* Right Column: Categories */}
            <div className="lg:col-span-8">
              <CategoryList
                subjectSlug={slug}
                chapters={chapters}
                exams={exams}
                onSelectCategory={(categorySlug) =>
                  router.push(`/exam/${slug}/${categorySlug}`)
                }
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
