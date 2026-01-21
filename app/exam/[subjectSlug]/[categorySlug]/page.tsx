import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ExamContent } from '@/components/exam/ExamContent';

async function getData(categorySlug: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt_token')?.value;
  
  if (!token) {
      return { user: null, history: [], question: null };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `jwt_token=${token}`
  };
  /* 
    SSR Data Fetching Strategy:
    1. Try BACKEND_INTERNAL_URL (Best for Docker/Zeabur internal networking, e.g. http://backend:3001/api)
    2. Try NEXT_PUBLIC_BACKEND_URL (Public URL, might loopback via internet)
    3. Fallback to localhost (Only works for local dev)
  */
  const baseUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';

  try {
    // 1. Fetch User
    const userRes = await fetch(`${baseUrl}/users/profile`, { headers, cache: 'no-store' });
    
    if (userRes.status === 401) {
        return { user: null, history: [], question: null, unauthorized: true };
    }
    
    const user = userRes.ok ? await userRes.json() : null;

    // 2. Fetch History
    let history = [];
    if (user) {
        const historyRes = await fetch(`${baseUrl}/questions/history/${categorySlug}`, { headers, cache: 'no-store' });
        if (historyRes.ok) history = await historyRes.json();
    }

    // 3. Fetch Next Question
    let question = null;
    if (user) {
        const qRes = await fetch(`${baseUrl}/questions/next/${categorySlug}?force=false`, { headers, cache: 'no-store' });
        if (qRes.ok) question = await qRes.json();
    }
    
    return { user, history, question };
  } catch (error) {
    console.error('SSR Data Fetch Error:', error);
    return { user: null, history: [], question: null };
  }
}

export default async function ExamPage({ params }: { params: Promise<{ subjectSlug: string; categorySlug: string }> }) {
  const { subjectSlug, categorySlug } = await params;
  const { user, history, question, unauthorized } = await getData(categorySlug);
  
  if (unauthorized || !user) {
      redirect('/login');
  }
  
  return (
    <ExamContent 
        subjectSlug={subjectSlug} 
        categorySlug={categorySlug}
        initialUser={user}
        initialHistory={history}
        initialQuestion={question}
    />
  );
}
