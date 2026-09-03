import { unstable_cache } from 'next/cache';
import { list } from './airtable';
import { inStock, SERVICE } from './catalog-filter';
import { nbspShekel } from './format';
import type { Product, ProductFields } from './types';

/**
 * הפרדיקטים הטהורים חיים ב-`catalog-filter` (בטוח ללקוח, כי הקובץ הזה מושך
 * `server-only` דרך `airtable.ts`). כאן רק מיוצאים מחדש, כדי שקוד שרת ימשיך
 * לייבא אותם מ-`catalog` בלי להכיר את החלוקה.
 */
export { SERVICE, isService, inStock, highlights } from './catalog-filter';

export function related(p: Product, all: Product[], n = 3): Product[] {
  const others = all.filter((x) => x.id !== p.id);
  const score = (x: Product) => (x.fields.Category === p.fields.Category ? 0 : 2) + (inStock(x) ? 0 : 1);
  return others.sort((a, b) => score(a) - score(b)).slice(0, n);
}

export function categories(all: Product[]): string[] {
  const seen = new Set<string>();
  for (const p of all) if (p.fields.Category) seen.add(p.fields.Category);
  const list = [...seen].filter((c) => c !== SERVICE);
  return seen.has(SERVICE) ? [...list, SERVICE] : list;
}

/**
 * טקסט המוצר נכתב ב-Airtable עם רווח רגיל לפני ₪ ("מחיר: 690 ₪ לחודש"), ולכן הסימן
 * נופל לשורה נפרדת בעמודות צרות. מנורמל כאן, בשער היחיד שדרכו נכנס הקטלוג, ולא
 * בכל רכיב שמציג תיאור או מפרט.
 */
const load = unstable_cache(
  async () =>
    (await list<ProductFields>('Products', { filter: "{Sku}!=''", sort: [{ field: 'Name' }] })).map((p) => ({
      ...p,
      fields: {
        ...p.fields,
        Highlights: p.fields.Highlights && nbspShekel(p.fields.Highlights),
        Description: p.fields.Description && nbspShekel(p.fields.Description),
      },
    })),
  ['products'],
  { revalidate: 60, tags: ['products'] },
);

export const getProducts = () => load();

export async function getProduct(sku: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.fields.Sku?.toUpperCase() === sku.toUpperCase()) ?? null;
}
