import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  setCurrentSubject,
  setCategories,
  setLoading,
  fetchSubjectStats,
} from '@/lib/store/slices/subjectsSlice';
import { getSubjectBySlug, getCategoriesBySubject } from '@/lib/api';

export function useSubjectData(params: Promise<{ slug: string }>) {
  const { slug } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentSubject, categories, loading, currentSubjectStats } = useAppSelector(
    (state) => state.subjects
  );

  // Filter categories
  const chapters = categories.filter((c) => !c.type || c.type === 'CHAPTER');
  const exams = categories.filter((c) => c.type === 'EXAM');

  useEffect(() => {
    // If subject data isn't loaded or slug changed, start loading
    if (!currentSubject || currentSubject.slug !== slug) {
      dispatch(setLoading(true));
    }

    const fetchData = async () => {
      try {
        const subjectData = await getSubjectBySlug(slug);
        dispatch(setCurrentSubject(subjectData));

        const [categoriesData] = await Promise.all([
          getCategoriesBySubject(subjectData._id),
          dispatch(fetchSubjectStats(slug)),
        ]);

        dispatch(setCategories(categoriesData));
      } catch (error) {
        console.error('Failed to fetch subject data:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchData();
  }, [slug, dispatch]); // Removed router from deps as it's stable, kept dispatch

  return {
    slug,
    router,
    dispatch,
    subject: currentSubject,
    chapters,
    exams,
    loading,
    stats: currentSubjectStats,
  };
}
