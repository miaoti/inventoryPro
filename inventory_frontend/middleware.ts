import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isPublicPage = request.nextUrl.pathname === '/' || 
                      request.nextUrl.pathname.startsWith('/barcode-scanner') ||
                      request.nextUrl.pathname === '/redirect-scanner'; // Allow public scanner redirect page

  // Special handling for /scanner route
  if (request.nextUrl.pathname === '/scanner') {
    if (token) {
      // User is authenticated, redirect to the scan router page which will handle further routing
      return NextResponse.redirect(new URL('/redirect-scanner', request.url));
    } else {
      // User is not authenticated, redirect to public barcode scanner
      return NextResponse.redirect(new URL('/barcode-scanner', request.url));
    }
  }

  // Protected routes that require authentication
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/inventory') ||
                          request.nextUrl.pathname.startsWith('/reports');

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