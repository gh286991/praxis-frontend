'use client';

import { CyberpunkBackground } from '@/components/CyberpunkBackground';
import { AppNavbar } from '@/components/AppNavbar';
import { Footer } from '@/components/landing/Footer';
import { SubjectHeader } from '@/components/subject/SubjectHeader';
import { SubjectStats } from '@/components/subject/SubjectStats';
import { CategoryList } from '@/components/subject/CategoryList';
import { ImportExamDialog } from '@/components/subject/ImportExamDialog';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Subject, Category, SubjectStats as ISubjectStats } from '@/lib/store/slices/subjectsSlice';

interface SubjectPageClientProps {
  slug: string;
  initialSubject: Subject;
  initialCategories: Category[];
  initialStats: ISubjectStats | null;
}

export default function SubjectPageClient({
  slug,
  initialSubject,
  initialCategories,
  initialStats,
}: SubjectPageClientProps) {
  const router = useRouter();
  const [subject] = useState<Subject>(initialSubject);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [stats] = useState<ISubjectStats | null>(initialStats);

  // Filter categories into chapters and exams
  const chapters = categories.filter((c) => !c.type || c.type === 'CHAPTER');
  const exams = categories.filter((c) => c.type === 'EXAM');

  const handleImportSuccess = (newCategories: Category[]) => {
    setCategories(newCategories);
    router.refresh(); // Refresh server components (optional if we already updated local state)
  };

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
                  <ImportExamDialog
                    subjectId={subject._id}
                    onImportSuccess={handleImportSuccess}
                  />
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
