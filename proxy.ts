import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/login') return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySession(process.env.AUTH_SECRET, token, Date.now())) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  // Everything except Next's static assets and the favicon.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
