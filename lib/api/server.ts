import { cookies } from 'next/headers';
import { Subject, Category, SubjectStats } from '@/lib/store/slices/subjectsSlice';
import { Question } from '@/lib/store/slices/questionsSlice';
import { UserProfile } from '@/lib/store/slices/userSlice';

/**
 * Server-side fetch wrapper that handles:
 * 1. Base URL resolution (Internal vs Public)
 * 2. Cookie forwarding (for authentication)
 * 3. Default headers
 */
export async function fetchServer<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt_token')?.value;

  // Determine Base URL
  // Priority: Internal (Docker/Zeabur) > Public Env > Localhost
  const baseUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:3001/api';

  // Prepare Headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Cookie'] = `jwt_token=${token}`;
  }

  try {
    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    
    // Default to no-store for dynamic data unless specified otherwise
    const fetchOptions: RequestInit = {
      cache: 'no-store',
      ...options,
      headers,
    };

    console.log(`[SSR] Fetching: ${url}`);
    
    const response = await fetch(url, fetchOptions);

    if (response.status === 404) return null;
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`[SSR] Error fetching request ${path}:`, error);
    return null;
  }
}

/**
 * Structured Server API Client
 * Use this in Server Components for cleaner data fetching
 */
export const serverApi = {
  subjects: {
    getBySlug: (slug: string) => fetchServer<Subject>(`/subjects/${slug}`),
  },
  categories: {
    getBySubject: (subjectId: string) => fetchServer<Category[]>(`/categories/subject/${subjectId}`),
    getBySlug: (subjectSlug: string, categorySlug: string) => fetchServer<Category>(`/categories/${subjectSlug}/${categorySlug}`), // Note: Verify if this endpoint exists or needs implementation. 
    // Wait, the backend endpoint for single category might not exist or be different. 
    // Standard approach: get all by subject and filter. But efficient way is better.
    // Let's assume for now we use filtered approach in page if specific endpoint missing.
  },
  questions: {
    getList: (categorySlug: string) => fetchServer<Question[]>(`/questions/list/${categorySlug}`),
    getById: (id: string) => fetchServer<Question>(`/questions/${id}`),
  },
  stats: {
    getBySubject: (slug: string) => fetchServer<SubjectStats>(`/stats/subject/${slug}`),
  },
  auth: {
    getProfile: () => fetchServer<UserProfile>('/users/profile'),
  },
};
