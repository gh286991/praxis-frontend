import { redirect, notFound } from 'next/navigation';
import { ExamContent } from '@/components/exam/ExamContent';
import { serverApi } from '@/lib/api/server';
import { Question } from '@/lib/store/slices/questionsSlice';

export const dynamic = 'force-dynamic';

interface ExamPageProps {
  params: Promise<{ subjectSlug: string; categorySlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ExamPage({ params, searchParams }: ExamPageProps) {
  const { subjectSlug, categorySlug } = await params;
  const { q: rawQ } = await searchParams; // searchParams also needs await in typical Next 15 patterns if typed as Promise

  const qId = Array.isArray(rawQ) ? rawQ[0] : rawQ;

  // Auth + Subject can be parallel
  const [user, subject] = await Promise.all([
    serverApi.auth.getProfile(),
    serverApi.subjects.getBySlug(subjectSlug),
  ]);

  if (!user) redirect('/login');
  if (!subject) redirect('/courses'); // or notFound()

  const categories = (await serverApi.categories.getBySubject(subject._id)) ?? [];
  const currentCategory =
    categories.find(c => c.slug === categorySlug) ??
    categories.find(c => c._id === categorySlug);

  if (!currentCategory) {
    // 你可以選擇 redirect 或 notFound
    notFound();
  }

  const [questions, initialCurrentQuestion] = await Promise.all([
    serverApi.questions.getList(currentCategory._id).then(r => r ?? []),
    qId ? serverApi.questions.getById(qId) : Promise.resolve(null),
  ]);

  // Optional: ensure qId belongs to this category
  const safeCurrentQuestion =
    initialCurrentQuestion && (initialCurrentQuestion as any).categoryId === currentCategory._id
      ? (initialCurrentQuestion as Question)
      : null;

  return (
    <ExamContent
      subjectSlug={subjectSlug}
      categorySlug={categorySlug}
      initialUser={user}
      initialSubject={subject}
      initialCategory={currentCategory}
      initialQuestions={questions}
      initialCurrentQuestion={safeCurrentQuestion}
    />
  );
}
