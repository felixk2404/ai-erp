import { describe, it, expect } from 'vitest';
import { stockLed, stockLabel, parseStock, MAX_STOCK } from './stock';

describe('stockLed', () => {
  it('turns red at zero, amber under three, green above', () => {
    expect(stockLed(0, false)).toBe('red');
    expect(stockLed(1, false)).toBe('amber');
    expect(stockLed(2, false)).toBe('amber');
    expect(stockLed(3, false)).toBe('green');
    expect(stockLed(34, false)).toBe('green');
  });

  it('treats a missing Stock as zero — an empty field is not "in stock"', () => {
    expect(stockLed(undefined, false)).toBe('red');
  });

  it('stays off for a service, which has no stock to run out of', () => {
    expect(stockLed(undefined, true)).toBe('off');
    expect(stockLed(0, true)).toBe('off');
  });
});

describe('stockLabel', () => {
  it('counts units, names the empty shelf, and marks a service', () => {
    expect(stockLabel(4, false)).toBe('4 במלאי');
    expect(stockLabel(0, false)).toBe('אזל');
    expect(stockLabel(undefined, false)).toBe('אזל');
    expect(stockLabel(0, true)).toBe('שירות');
  });
});

describe('parseStock', () => {
  it('accepts whole numbers in range, trimmed', () => {
    expect(parseStock('0')).toEqual({ ok: true, value: 0 });
    expect(parseStock(' 12 ')).toEqual({ ok: true, value: 12 });
    expect(parseStock(String(MAX_STOCK))).toEqual({ ok: true, value: MAX_STOCK });
  });

  it('rejects empty, non-numeric, fractional, negative and oversized input', () => {
    for (const bad of ['', '   ', 'abc', '3.5', '-1', '1000', 'NaN', '1e4', '1e2', '0x1f', '+5', ' 5 5']) {
      expect(parseStock(bad).ok, bad).toBe(false);
    }
  });

  // Number('1e2') הוא 100 ו-Number('0x1f') הוא 31 — שניהם שלמים ובטווח, ולכן היו עוברים
  // בדיקת טווח תמימה ונשמרים ככמות שאיש לא הקליד.
  it('does not let JS number syntax smuggle in a quantity nobody typed', () => {
    expect(parseStock('1e2')).toEqual({ ok: false, error: 'הכמות חייבת להיות מספר שלם' });
    expect(parseStock('0x1f')).toEqual({ ok: false, error: 'הכמות חייבת להיות מספר שלם' });
  });

  it('explains the rejection in Hebrew instead of a bare false', () => {
    const r = parseStock('-2');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('הכמות לא יכולה להיות שלילית');
  });
});
