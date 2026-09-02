import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';

// M4: /api/health הוסר — אין מסלול כזה, והוא היה פותח את הנתיב ברגע שמישהו יוסיף אותו.
const PUBLIC = ['/login', '/support', '/brand', '/favicon.ico'];

/**
 * נכסים סטטיים ב-GET לא דורשים סשן. הבדיקה כאן ולא ב-matcher בכוונה:
 * matcher שמדלג על כל נתיב שנגמר ב-.png דילג גם על POST לאותו נתיב, ו-server action
 * נשלח כ-POST לכתובת הנוכחית ומנותב לפי כותרת ולא לפי הנתיב — כלומר `POST /customers/x.png`
 * היה מריץ פעולות שרת בלי אימות.
 */
const STATIC_FILE = /\.(?:png|jpe?g|svg|ico|webp|avif|gif|woff2?|txt|xml)$/i;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next();
  if (req.method === 'GET' && STATIC_FILE.test(pathname)) return NextResponse.next();

  // בלי מפתח אין מה לאמת מולו. נכשלים סגור: קודם כל בקשה נבדקה מול מפתח ריק וידוע.
  const secret = process.env.AUTH_SECRET;
  const ok = secret ? await verifySession(req.cookies.get(SESSION_COOKIE)?.value, secret) : false;
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  if (pathname !== '/') url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // הכל חוץ מקבצי הבנייה של Next. קבצים סטטיים אחרים נבדקים בגוף ה-proxy לפי מתודה.
  matcher: ['/((?!_next/static|_next/image).*)'],
};
