import { describe, it, expect } from 'vitest';
import { createRateLimiter } from './rate-limit';

describe('rate limiter', () => {
  it('allows up to the limit within the window, then blocks, then resets', () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 3, windowMs: 1000, now: () => t });
    expect([rl.allow('ip1'), rl.allow('ip1'), rl.allow('ip1')]).toEqual([true, true, true]);
    expect(rl.allow('ip1')).toBe(false);
    expect(rl.allow('ip2')).toBe(true);
    t = 1001;
    expect(rl.allow('ip1')).toBe(true);
  });
});
