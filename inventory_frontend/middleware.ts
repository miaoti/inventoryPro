import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isPublicPage = request.nextUrl.pathname === '/' || 
                      request.nextUrl.pathname.startsWith('/scanner') ||
                      request.nextUrl.pathname.startsWith('/scan');

  // Protected routes that require authentication (excluding /scanner)
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/inventory') ||
                          request.nextUrl.pathname.startsWith('/reports') ||
                          request.nextUrl.pathname.startsWith('/admin') ||
                          request.nextUrl.pathname.startsWith('/profile') ||
                          request.nextUrl.pathname.startsWith('/settings') ||
                          request.nextUrl.pathname.startsWith('/items') ||
                          request.nextUrl.pathname.startsWith('/alerts') ||
                          request.nextUrl.pathname.startsWith('/usage-reports') ||
                          request.nextUrl.pathname.startsWith('/quick-stats');

  if (!token && isProtectedRoute) {
    // Redirect to main page '/' if trying to access protected route without token
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token && isAuthPage) {
    // Redirect to dashboard if trying to access login page with token
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 