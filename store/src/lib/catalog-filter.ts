import type { Product } from './types';

/**
 * הפרדיקטים הטהורים חיים כאן ולא ב-`catalog.ts`, כי `catalog.ts` מושך `server-only`
 * דרך `airtable.ts` ולכן אסור בצד לקוח. `catalog-filter.test.ts` נועל את שתי
 * המימושים זה לזה (parity) כדי שלא יתפצלו.
 */
export const SERVICE = 'שירותים';

export const isService = (p: Product) => p.fields.Category === SERVICE;

export const inStock = (p: Product) => isService(p) || (p.fields.Stock ?? 0) > 0;

export const highlights = (p: Product) =>
  (p.fields.Highlights ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

export const SORTS = ['name', 'price-asc', 'price-desc'] as const;
export type Sort = (typeof SORTS)[number];

export const VIEWS = ['grid', 'spec'] as const;
export type View = (typeof VIEWS)[number];

export type CatalogParams = { c: string; q: string; sort: Sort; view: View };

const price = (p: Product) => p.fields.Price ?? 0;

/** haystack אחד לכל מוצר: שם, מק"ט ותיאור — עברית ולטינית, ללא תלות ברישיות. */
const haystack = (p: Product) =>
  `${p.fields.Name ?? ''}\n${p.fields.Sku ?? ''}\n${p.fields.Description ?? ''}`.toLowerCase();

/**
 * סינון ומיון של הקטלוג — טהור, בלי React ובלי URL, כדי שיהיה נבדק.
 * `c` = קטגוריה בהתאמה מדויקת (ריק = הכל), `q` = חיפוש חופשי, `sort` = סדר התצוגה.
 */
export function filterProducts(
  products: Product[],
  { c = '', q = '', sort = 'name' }: { c?: string; q?: string; sort?: Sort } = {},
): Product[] {
  const term = q.trim().toLowerCase();
  const out = products.filter(
    (p) => (!c || p.fields.Category === c) && (!term || haystack(p).includes(term)),
  );
  return out.sort((a, b) =>
    sort === 'price-asc'
      ? price(a) - price(b)
      : sort === 'price-desc'
        ? price(b) - price(a)
        : (a.fields.Name ?? '').localeCompare(b.fields.Name ?? '', 'he'),
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

const pick = <T extends string>(v: string | string[] | undefined, allowed: readonly T[], fallback: T): T => {
  const value = one(v) as T;
  return allowed.includes(value) ? value : fallback;
};

/** `?c=&q=&sort=&view=` → מצב תקין תמיד; ערך זר נופל לברירת המחדל במקום לשבור את העמוד. */
export function parseCatalogParams(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogParams {
  return {
    c: one(searchParams.c).trim(),
    q: one(searchParams.q).trim(),
    sort: pick(searchParams.sort, SORTS, 'name'),
    view: pick(searchParams.view, VIEWS, 'grid'),
  };
}

/** אותו סדר פרמטרים תמיד, וברירות מחדל נשמטות — כדי שה-URL יישאר קריא ויציב. */
export function catalogQuery({ c, q, sort, view }: CatalogParams): string {
  const p = new URLSearchParams();
  if (c) p.set('c', c);
  if (q) p.set('q', q);
  if (sort !== 'name') p.set('sort', sort);
  if (view !== 'grid') p.set('view', view);
  return p.toString();
}

export type GridPlan = { lead: boolean; columns: string };

// מספר העמודות לא עולה על מספר התוצאות, אחרת סינון שמחזיר 2 פריטים משאיר
// מסילות ריקות ושחורות לצדם. מחרוזות מלאות כדי ש-Tailwind יראה אותן.
const COLUMNS = [
  'grid-cols-1',
  'grid-cols-1',
  'grid-cols-1 sm:grid-cols-2',
  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
];

/** כרטיס מוביל רק כשיש מספיק תוצאות שיצדיקו אותו; אחרת רשת אחידה וצרה. */
export function gridPlan(count: number): GridPlan {
  return { lead: count >= 4, columns: COLUMNS[Math.min(count, 4)] };
}

export function pickLead(products: Product[]): Product | null {
  const eligible = products.filter((p) => !isService(p) && inStock(p) && p.fields.ImageUrl);
  const dearest = eligible.reduce<Product | null>(
    (best, p) => (best && (best.fields.Price ?? 0) >= (p.fields.Price ?? 0) ? best : p),
    null,
  );
  return dearest ?? products[0] ?? null;
}
