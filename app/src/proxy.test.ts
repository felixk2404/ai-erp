import { describe, it, expect, vi } from 'vitest';
import { signSession } from '@/lib/auth';

const { proxy, config } = await import('./proxy');
const { NextRequest } = await import('next/server');

// בלי סשן בבקשה — מה שעובר, עובר בגלל כלל ציבורי או נכס סטטי. סשן אמיתי נבדק בסוף.
const req = (path: string, method = 'GET', cookie?: string) =>
  proxy(new NextRequest(new Request(`https://ai-erp.example${path}`, { method, headers: cookie ? { cookie } : undefined })));

const redirectedToLogin = async (path: string, method = 'GET', cookie?: string) => {
  const res = await req(path, method, cookie);
  return res.status === 307 && new URL(res.headers.get('location')!).pathname === '/login';
};

describe('proxy', () => {
  it('lets a static asset through on GET', async () => {
    expect(await redirectedToLogin('/brand/logo-mark.png')).toBe(false);
    expect(await redirectedToLogin('/icon.png')).toBe(false);
  });

  it('does NOT let a static-looking path through on POST — that is how a server action would slip past auth', async () => {
    expect(await redirectedToLogin('/customers/x.png', 'POST')).toBe(true);
    expect(await redirectedToLogin('/invoices/anything.svg', 'POST')).toBe(true);
    expect(await redirectedToLogin('/customers/x.webmanifest', 'POST')).toBe(true);
  });

  // בלי זה המניפסט חוזר כהפניה ל-/login, הדפדפן לא מצליח לפרסר אותו,
  // ו"הוספה למסך הבית" מאבדת שם, אייקון ומצב standalone.
  it('serves the PWA manifest without a session', async () => {
    expect(await redirectedToLogin('/manifest.webmanifest')).toBe(false);
  });

  it('keeps the public pages public and everything else gated', async () => {
    expect(await redirectedToLogin('/login')).toBe(false);
    expect(await redirectedToLogin('/support')).toBe(false);
    expect(await redirectedToLogin('/support', 'POST')).toBe(false);
    expect(await redirectedToLogin('/')).toBe(true);
    expect(await redirectedToLogin('/customers')).toBe(true);
    expect(await redirectedToLogin('/leads', 'POST')).toBe(true);
  });

  it('remembers where the user was going', async () => {
    const res = await req('/invoices');
    expect(new URL(res.headers.get('location')!).searchParams.get('next')).toBe('/invoices');
  });

  // הבאג האמיתי היה ב-matcher, לא בגוף: הוא דילג על כל נתיב שנגמר בסיומת של תמונה,
  // כולל POST. הבדיקה הזו נכשלת אם מישהו יחזיר את הפטור הזה ל-matcher.
  it('routes every non-build path through the proxy, image extensions included', () => {
    const runs = (path: string) => config.matcher.some((m) => new RegExp(`^${m}$`).test(path));
    expect(runs('/customers/x.png')).toBe(true);
    expect(runs('/leads/anything.svg')).toBe(true);
    expect(runs('/customers')).toBe(true);
    expect(runs('/_next/static/chunks/main.js')).toBe(false);
  });

  it('accepts a session signed with the real secret', async () => {
    const secret = 'x'.repeat(32);
    vi.stubEnv('AUTH_SECRET', secret);
    expect(await redirectedToLogin('/invoices', 'GET', `erp_session=${await signSession(secret)}`)).toBe(false);
  });

  it('fails closed when AUTH_SECRET is missing instead of verifying against an empty key', async () => {
    const token = await signSession('x'.repeat(32));
    vi.stubEnv('AUTH_SECRET', '');
    expect(await redirectedToLogin('/invoices', 'GET', `erp_session=${token}`)).toBe(true);
  });
});
