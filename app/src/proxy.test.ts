import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { signSession } from './lib/auth';
import { proxy } from './proxy';

const req = (path: string, cookie?: string) => new NextRequest(`https://erp.test${path}`, cookie ? { headers: { cookie } } : undefined);

describe('proxy auth gate', () => {
  it('lets the public pages through', async () => {
    expect((await proxy(req('/support'))).headers.get('location')).toBeNull();
  });

  it('redirects to login without a session', async () => {
    vi.stubEnv('AUTH_SECRET', 'x'.repeat(32));
    expect((await proxy(req('/invoices'))).headers.get('location')).toContain('/login');
  });

  it('accepts a session signed with the real secret', async () => {
    const secret = 'x'.repeat(32);
    vi.stubEnv('AUTH_SECRET', secret);
    const res = await proxy(req('/invoices', `erp_session=${await signSession(secret)}`));
    expect(res.headers.get('location')).toBeNull();
  });

  it('fails closed when AUTH_SECRET is missing instead of verifying against an empty key', async () => {
    const token = await signSession('x'.repeat(32));
    vi.stubEnv('AUTH_SECRET', '');
    expect((await proxy(req('/invoices', `erp_session=${token}`))).headers.get('location')).toContain('/login');
  });
});
