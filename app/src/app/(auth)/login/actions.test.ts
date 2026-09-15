import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ ip: '', set: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({ env: () => ({ APP_PASSWORD: 'correct', AUTH_SECRET: 'test-secret' }) }));
vi.mock('next/headers', () => ({ cookies: async () => ({ set: mocks.set }), headers: async () => new Headers({ 'x-forwarded-for': mocks.ip }) }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
import { login } from './actions';
let seq = 0;
beforeEach(() => { mocks.ip = `login-${++seq}`; mocks.set.mockClear(); });
const form = (password: string, next = '/') => { const fd = new FormData(); fd.set('password', password); fd.set('next', next); return fd; };
it.each(['/\\evil.example', '/\n/evil.example', '//evil.example'])('לא מפנה מחוץ לאתר דרך %j', async next => {
  await expect(login(undefined, form('correct', next))).rejects.toThrow('redirect:/');
  // בדיקה על כתובת מדויקת: prefix בלבד היה מקבל גם redirect://evil.
  try { await login(undefined, form('correct', next)); } catch (e) { expect((e as Error).message).toBe('redirect:/'); }
});
it('מאפשר יעד פנימי כולל סינון', async () => {
  await expect(login(undefined, form('correct', '/orders?status=new'))).rejects.toThrow('redirect:/orders?status=new');
});
it('ניסיונות סיסמה חוזרים מאותו IP נחסמים', async () => {
  let result;
  for (let i=0; i<11; i++) result = await login(undefined, form('wrong'));
  expect(result?.error).toMatch('יותר מדי');
  expect(mocks.set).not.toHaveBeenCalled();
});
