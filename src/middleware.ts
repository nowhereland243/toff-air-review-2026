import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static Next.js assets, login page, and login API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login' ||
    pathname === '/api/login'
  ) {
    return NextResponse.next();
  }

  const sitePassword = process.env.SITE_PASSWORD;
  
  // If SITE_PASSWORD is not set in env, allow access in local dev
  if (!sitePassword) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('toff_auth');

  if (authCookie?.value === sitePassword) {
    return NextResponse.next();
  }

  // Redirect unauthenticated request to /login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
