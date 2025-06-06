import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isPublicPage = request.nextUrl.pathname.startsWith('/barcode-scanner') || 
                      request.nextUrl.pathname.startsWith('/scanner') ||
                      request.nextUrl.pathname === '/';

  if (!token && !isAuthPage && !isPublicPage) {
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