import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  SESSION_COOKIE: 'erp_session',
  // אין סשן בשום בקשה בבדיקות האלה — מה שעובר, עובר בגלל כלל ציבורי או נכס סטטי.
  verifySession: async () => false,
}));

const { proxy, config } = await import('./proxy');
const { NextRequest } = await import('next/server');

const req = (path: string, method = 'GET') =>
  proxy(new NextRequest(new Request(`https://ai-erp.example${path}`, { method })));

const redirectedToLogin = async (path: string, method = 'GET') => {
  const res = await req(path, method);
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
});
