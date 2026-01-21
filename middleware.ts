import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt_token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth');
  const isPublicPage = request.nextUrl.pathname === '/';

  // Only protect routes that require authentication
  if (!token && !isAuthPage && !isPublicPage && !request.nextUrl.pathname.startsWith('/_next')) {
    // If no token and trying to access protected route, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Let pages handle their own authentication logic
  // This prevents conflicts between middleware and page-level auth checks
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
