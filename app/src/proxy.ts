import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';

const PUBLIC = ['/login', '/support', '/brand', '/favicon.ico', '/api/health'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next();

  const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value, process.env.AUTH_SECRET ?? '');
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  if (pathname !== '/') url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // הכל חוץ מנכסים סטטיים
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:png|jpg|svg|ico|woff2?)$).*)'],
};
