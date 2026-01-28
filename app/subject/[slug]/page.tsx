import { notFound } from 'next/navigation';
import SubjectPageClient from '@/components/subject/SubjectPageClient';
import { Category, SubjectStats } from '@/lib/store/slices/subjectsSlice';
import { serverApi } from '@/lib/api/server';

async function getData(slug: string) {
  // 1. Fetch Subject
  const subject = await serverApi.subjects.getBySlug(slug);
  
  if (!subject) return null;

  // 2. Fetch Categories & Stats in parallel
  const [categories, stats] = await Promise.all([
    serverApi.categories.getBySubject(subject._id),
    serverApi.stats.getBySubject(slug)
  ]);

  return { 
    subject, 
    categories: categories || [], 
    stats 
  };
}

export default async function SubjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getData(slug);

  if (!data) {
    // If subject not found, show 404 or loading state helper logic failed
    return notFound();
  }

  return (
    <SubjectPageClient
      slug={slug}
      initialSubject={data.subject}
      initialCategories={data.categories}
      initialStats={data.stats}
    />
  );
}
