import { describe, it, expect } from 'vitest';
import { ils, dateIL, monthKey } from './format';

describe('format', () => {
  it('formats ILS with two decimals and a trailing shekel sign', () => {
    expect(ils(1180)).toBe('1,180.00 ₪');
    expect(ils(0)).toBe('0.00 ₪');
    expect(ils(349.9)).toBe('349.90 ₪');
  });

  it('formats ISO dates as dd/MM/yyyy in Israel time', () => {
    expect(dateIL('2026-09-02T08:28:29.000Z')).toBe('02/09/2026');
    expect(dateIL('2026-01-01T23:30:00.000Z')).toBe('02/01/2026'); // אחרי חצות בישראל
  });

  it('monthKey uses Israel time', () => {
    expect(monthKey('2026-09-02T08:28:29.000Z')).toBe('2026-09');
    expect(monthKey('2026-08-31T22:30:00.000Z')).toBe('2026-09');
  });
});
