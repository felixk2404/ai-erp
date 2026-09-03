import type { Led } from './status';
import type { Product } from './types';

/** קטגוריית השירותים — לשירות אין מלאי, בדיוק כמו ב-`store/src/lib/catalog-filter.ts`. */
export const SERVICE = 'שירותים';
export const isService = (p: Product) => p.fields.Category === SERVICE;

/** מעל 999 יחידות זו כבר טעות הקלדה ולא מלאי של חנות אחת. */
export const MAX_STOCK = 999;
const LOW_STOCK = 3;

/**
 * נורית המלאי: אדום = אזל, כתום = נגמר עוד מעט, ירוק = יש.
 * שירות אין לו מלאי ולכן נורית כבויה — לא ירוקה, כדי שלא ייספר כמלאי.
 */
export function stockLed(stock: number | undefined, service: boolean): Led {
  if (service) return 'off';
  const n = stock ?? 0;
  return n === 0 ? 'red' : n < LOW_STOCK ? 'amber' : 'green';
}

/** התווית שליד הנורית בכרטיס: "4 במלאי" / "אזל" / "שירות". */
export function stockLabel(stock: number | undefined, service: boolean): string {
  if (service) return 'שירות';
  const n = stock ?? 0;
  return n === 0 ? 'אזל' : `${n} במלאי`;
}

export type ParsedStock = { ok: true; value: number } | { ok: false; error: string };

/** קלט חופשי מהשדה → מספר שלם 0–999. חצי יחידה או מספר שלילי הם טעות, לא עיגול. */
export function parseStock(input: string): ParsedStock {
  const s = input.trim();
  if (!s) return { ok: false, error: 'יש להזין כמות' };
  if (s.startsWith('-')) return { ok: false, error: 'הכמות לא יכולה להיות שלילית' };
  // ספרות בלבד, לפני Number(): '1e2' ו-'0x1f' הם מספרים תקינים ל-JS אבל לא כמות שמישהו התכוון להקליד.
  if (!/^\d+$/.test(s)) return { ok: false, error: 'הכמות חייבת להיות מספר שלם' };
  const n = Number(s);
  if (n > MAX_STOCK) return { ok: false, error: `הכמות המרבית היא ${MAX_STOCK}` };
  return { ok: true, value: n };
}
