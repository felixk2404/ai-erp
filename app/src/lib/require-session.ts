import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession } from './auth';

/** כל פעולת ניהול היא שער נפרד: לא מסתמכים על הנתיב או על ה-proxy. */
export async function requireSession(): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!secret || !(await verifySession(token, secret))) redirect('/login');
}
