import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rate-limit';

/** שעון מוזרק — בלי טיימרים מזויפים ובלי המתנה אמיתית. */
const at = (limit: number, windowMs: number) => {
  let t = 0;
  return { rl: createRateLimiter({ limit, windowMs, now: () => t }), tick: (to: number) => (t = to) };
};

describe('createRateLimiter', () => {
  it('חוסם מעל המכסה, ומשחרר כשהחלון מתגלגל', () => {
    const { rl, tick } = at(2, 1000);
    expect(rl.allow('a')).toBe(true);
    expect(rl.allow('a')).toBe(true);
    expect(rl.allow('a')).toBe(false);

    tick(999);
    expect(rl.allow('a')).toBe(false);

    // ב-1000 שתי החותמות מ-0 יצאו מהחלון — המכסה מתאפסת.
    tick(1000);
    expect(rl.allow('a')).toBe(true);
    expect(rl.allow('a')).toBe(true);
    expect(rl.allow('a')).toBe(false);
  });

  it('מפתחות לא משפיעים זה על זה', () => {
    const { rl } = at(1, 1000);
    expect(rl.allow('a')).toBe(true);
    expect(rl.allow('a')).toBe(false);
    expect(rl.allow('b')).toBe(true);
  });

  it('מפנה מפתחות שפגו כשהמפה גדלה מעבר לסף', () => {
    const { rl, tick } = at(1, 1000);
    for (let i = 0; i <= 1000; i++) rl.allow(`ip-${i}`);
    expect(rl.size()).toBe(1001);

    // אחרי החלון, הבקשה הבאה סורקת ומנקה — ונשאר רק המפתח החדש.
    tick(5000);
    expect(rl.allow('fresh')).toBe(true);
    expect(rl.size()).toBe(1);
  });

  it('לא מפנה מפתחות חיים', () => {
    const { rl, tick } = at(1, 1000);
    for (let i = 0; i <= 1000; i++) rl.allow(`ip-${i}`);
    tick(500);
    rl.allow('fresh');
    expect(rl.size()).toBe(1002);
  });
});
