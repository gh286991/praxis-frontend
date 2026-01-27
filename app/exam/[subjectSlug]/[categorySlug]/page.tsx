'use client';

import { useParams } from 'next/navigation';
import { ExamContent } from '@/components/exam/ExamContent';
export const dynamic = "force-static"; // Disable SSR
export default function ExamPage() {
  const params = useParams();
  const subjectSlug = params.subjectSlug as string;
  const categorySlug = params.categorySlug as string;
  
  return (
    <ExamContent 
      subjectSlug={subjectSlug} 
      categorySlug={categorySlug}
    />
  );
}
