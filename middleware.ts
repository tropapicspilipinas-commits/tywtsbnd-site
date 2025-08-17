import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin and /api/admin/*
  const needsAuth =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin/');

  if (!needsAuth) return NextResponse.next();

  const auth = req.headers.get('authorization') || '';
  const [scheme, encoded] = auth.split(' ');

  if (scheme !== 'Basic' || !encoded) {
    return new NextResponse('Auth required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
    });
  }

  const [user, pass] = atob(encoded).split(':');
  const ok =
    user === (process.env.BASIC_AUTH_USER || '') &&
    pass === (process.env.BASIC_AUTH_PASS || '');

  if (!ok) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
