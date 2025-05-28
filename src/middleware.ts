import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // IMPORTANT: Completely disabling middleware redirects to fix login issue
  // This allows direct navigation without any redirects
  return NextResponse.next();

  // The code below is the original middleware logic, disabled for now
  /*
  // Check for Supabase auth cookie
  const hasAuthCookie = request.cookies.getAll().some(cookie => 
    cookie.name.startsWith('sb-') && 
    cookie.value && 
    cookie.value.length > 10
  );

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/register', '/login-debug'];
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // If no auth cookie and trying to access protected route, redirect to login
  if (!hasAuthCookie && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If has auth cookie and trying to access public route, redirect to home
  if (hasAuthCookie && isPublicRoute) {
    const redirectUrl = new URL('/', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
  */
}

// Define which routes the middleware applies to
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|general).*)'],
};
