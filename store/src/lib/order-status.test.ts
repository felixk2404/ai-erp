import { describe, expect, it } from 'vitest';
import { normalizeEmail, normalizeOrderNumber, STATUS_LABELS, STATUS_STEPS, stepIndex, withRetryHint } from './order-status';

describe('normalizeOrderNumber', () => {
  it('trims, upper-cases and strips anything outside A-Z0-9-', () => {
    expect(normalizeOrderNumber(' ord-0001 ')).toBe('ORD-0001');
    expect(normalizeOrderNumber('ord 0001!')).toBe('ORD0001');
  });
});

describe('normalizeEmail', () => {
  it('trims and lower-cases', () => {
    expect(normalizeEmail('  Felix@Example.com ')).toBe('felix@example.com');
  });
});

describe('stepIndex', () => {
  it('maps each positive status to its position on the timeline', () => {
    expect(stepIndex('new')).toBe(0);
    expect(stepIndex('confirmed')).toBe(1);
    expect(stepIndex('shipped')).toBe(2);
    expect(stepIndex('delivered')).toBe(3);
  });

  it('returns -1 for cancelled, which sits outside the timeline', () => {
    expect(stepIndex('cancelled')).toBe(-1);
  });
});

describe('withRetryHint', () => {
  it('adds a retry hint when the ERP says the order was not found', () => {
    expect(withRetryHint('ההזמנה לא נמצאה')).toBe('ההזמנה לא נמצאה. בדקו את המספר והאימייל.');
    expect(withRetryHint('ההזמנה לא נמצאה.')).toBe('ההזמנה לא נמצאה. בדקו את המספר והאימייל.');
  });

  it('leaves other errors untouched', () => {
    expect(withRetryHint('השירות לא זמין כרגע, נסו שוב בעוד רגע')).toBe('השירות לא זמין כרגע, נסו שוב בעוד רגע');
  });
});

describe('STATUS_LABELS', () => {
  it('has a Hebrew label for every step plus cancelled', () => {
    for (const step of STATUS_STEPS) expect(STATUS_LABELS[step]).toBeTruthy();
    expect(STATUS_LABELS.cancelled).toBe('בוטלה');
  });
});
