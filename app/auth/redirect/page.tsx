'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('jwt_token', token);
      router.push('/profile');
    } else {
      router.push('/login');
    }
  }, [router, searchParams]);

  return <p>Redirecting...</p>;
}

export default function AuthRedirectPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<p>Loading...</p>}>
        <RedirectContent />
      </Suspense>
    </div>
  );
}
