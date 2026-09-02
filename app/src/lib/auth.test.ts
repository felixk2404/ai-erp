import { describe, it, expect } from 'vitest';
import { signSession, verifySession } from './auth';

const secret = 's'.repeat(32);

describe('auth session', () => {
  it('round-trips a valid token', async () => {
    expect(await verifySession(await signSession(secret, 60), secret)).toBe(true);
  });

  it('rejects tampered, expired, missing and wrong-secret tokens', async () => {
    const t = await signSession(secret, 60);
    const tampered = t.slice(0, -1) + (t.endsWith('a') ? 'b' : 'a');
    expect(await verifySession(tampered, secret)).toBe(false);
    expect(await verifySession(await signSession(secret, -1), secret)).toBe(false);
    expect(await verifySession(undefined, secret)).toBe(false);
    expect(await verifySession('', secret)).toBe(false);
    expect(await verifySession('garbage', secret)).toBe(false);
    expect(await verifySession(t, 'x'.repeat(32))).toBe(false);
  });
});
