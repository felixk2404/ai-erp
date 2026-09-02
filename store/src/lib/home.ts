import { inStock, isService, SERVICE } from './catalog-filter';
import type { Product } from './types';

/**
 * בחירת התוכן של דף הבית. חי כאן ולא ב-`catalog.ts` כי `catalog.ts` מושך `server-only`
 * דרך `airtable.ts` — הפרדיקטים מיובאים מ-`catalog-filter` כדי שהקובץ יהיה נבדק.
 */

/**
 * מוצר הדגל נבחר בעין ולא רק במחיר: הצילום של המסך הוא מהגב, ופריט בזרקור חייב פנים.
 * הרשימה היא סדר עדיפויות; אם אף אחד מהם לא זמין עם תמונה — חוזרים לכלל המחיר.
 */
export const FLAGSHIP_PREFERENCE = ['TY-HP-200', 'TY-GH-700', 'TY-MN-27Q'] as const;

const price = (p: Product) => p.fields.Price ?? 0;
const skuOf = (p: Product) => p.fields.Sku ?? p.id;

/** מה שמותר להעמיד בחלון הראווה: חפץ פיזי שאפשר לקנות עכשיו. שירות אינו חפץ. */
const showable = (p: Product) => !isService(p) && inStock(p);

export function flagshipOf(all: Product[]): Product | undefined {
  const pool = all.filter(showable);
  for (const want of FLAGSHIP_PREFERENCE) {
    const hit = pool.find((p) => skuOf(p) === want && p.fields.ImageUrl);
    if (hit) return hit;
  }
  return [...pool].sort((a, b) => price(b) - price(a))[0];
}

/**
 * שישה מומלצים: קודם אחד לכל קטגוריה (היקר בכל קטגוריה), ואז השלמה מהיקרים שנותרו —
 * כדי שהרשת תראה את רוחב החנות ולא שלוש גרסאות של אותו דבר.
 * הדגל מוחרג: שני אלמנטים עם אותו `ViewTransition name` באותו עמוד מתנגשים.
 */
export function featuredOf(all: Product[], exclude?: Product, n = 6): Product[] {
  const byPrice = all.filter((p) => showable(p) && p.id !== exclude?.id).sort((a, b) => price(b) - price(a));
  const seen = new Set<string>();
  const lead: Product[] = [];
  const rest: Product[] = [];
  for (const p of byPrice) {
    const c = p.fields.Category ?? '';
    if (seen.has(c)) rest.push(p);
    else {
      seen.add(c);
      lead.push(p);
    }
  }
  return [...lead, ...rest].slice(0, n);
}

export type CategoryStat = { name: string; count: number; from: number };

/** קטגוריות בסדר ההופעה, `שירותים` תמיד אחרון — עם ספירה ומחיר פתיחה לכל אחת. */
export function statsOf(all: Product[]): CategoryStat[] {
  const order: string[] = [];
  for (const p of all) {
    const c = p.fields.Category;
    if (c && c !== SERVICE && !order.includes(c)) order.push(c);
  }
  if (all.some(isService)) order.push(SERVICE);
  return order.map((name) => {
    const items = all.filter((p) => p.fields.Category === name);
    return { name, count: items.length, from: Math.min(...items.map(price)) };
  });
}
