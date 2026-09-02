import type { Product } from './types';

/**
 * הפרדיקטים הטהורים חיים כאן ולא ב-`catalog.ts`, כי `catalog.ts` מושך `server-only`
 * דרך `airtable.ts` ולכן אסור בצד לקוח. `catalog.ts` מייצא אותם מחדש — מימוש אחד,
 * שני שערים.
 */
export const SERVICE = 'שירותים';

/**
 * מוצר הדגל נבחר בעין ולא רק במחיר: הצילום של המסך הוא מהגב, ופריט בזרקור חייב פנים.
 * הרשימה היא סדר עדיפויות, ומשותפת לדף הבית (`home.ts`) ולמוביל של הקטלוג.
 */
export const FLAGSHIP_PREFERENCE = ['TY-HP-200', 'TY-GH-700', 'TY-MN-27Q'] as const;

export const isService = (p: Product) => p.fields.Category === SERVICE;

export const inStock = (p: Product) => isService(p) || (p.fields.Stock ?? 0) > 0;

export const highlights = (p: Product) =>
  (p.fields.Highlights ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

/**
 * מה שהלקוח באמת צריך כדי לראות כרטיס. הגבול בין שרת ללקוח עובר כאן ורק כאן:
 * כמות המלאי (`Stock`) היא מידע פנימי ואסור לה לנסוע ב-RSC payload, והתיאור
 * המלא הוא מטען מיותר — הכרטיס מציג לכל היותר שתי שורות מפרט.
 */
export type ProductCardData = {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  inStock: boolean;
  service: boolean;
  highlights: string[];
};

/** `Product` (Airtable) → מה שמותר לשלוח ללקוח. השער היחיד. */
export function toCard(p: Product): ProductCardData {
  return {
    id: p.id,
    sku: p.fields.Sku ?? p.id,
    name: p.fields.Name,
    price: p.fields.Price ?? 0,
    category: p.fields.Category ?? '',
    ...(p.fields.ImageUrl ? { imageUrl: p.fields.ImageUrl } : {}),
    inStock: inStock(p),
    service: isService(p),
    highlights: highlights(p),
  };
}

export const SORTS = ['name', 'price-asc', 'price-desc'] as const;
export type Sort = (typeof SORTS)[number];

export const VIEWS = ['grid', 'spec'] as const;
export type View = (typeof VIEWS)[number];

export type CatalogParams = { c: string; q: string; sort: Sort; view: View };

/** haystack אחד לכל כרטיס: שם, מק"ט ומפרט — עברית ולטינית, ללא תלות ברישיות.
 *  התיאור המלא לא נוסע ללקוח (ראו `ProductCardData`), ולכן גם לא נחפש בו. */
const haystack = (p: ProductCardData) => `${p.name}\n${p.sku}\n${p.highlights.join('\n')}`.toLowerCase();

/**
 * סינון ומיון של הקטלוג — טהור, בלי React ובלי URL, כדי שיהיה נבדק.
 * `c` = קטגוריה בהתאמה מדויקת (ריק = הכל), `q` = חיפוש חופשי, `sort` = סדר התצוגה.
 */
export function filterProducts(
  products: ProductCardData[],
  { c = '', q = '', sort = 'name' }: { c?: string; q?: string; sort?: Sort } = {},
): ProductCardData[] {
  const term = q.trim().toLowerCase();
  const out = products.filter((p) => (!c || p.category === c) && (!term || haystack(p).includes(term)));
  return out.sort((a, b) =>
    sort === 'price-asc'
      ? a.price - b.price
      : sort === 'price-desc'
        ? b.price - a.price
        : a.name.localeCompare(b.name, 'he'),
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
// מסילות ריקות ושחורות לצדם. מתחת ל-4 תוצאות גם רוחב המסילה נחסם ל-320px
// ונצמד לקצה ההתחלה — אחרת שני כרטיסים נמתחים ל-620px ומשנים סוג.
// מחרוזות מלאות כדי ש-Tailwind יראה אותן.
const COLUMNS = [
  'grid-cols-1',
  'grid-cols-1 sm:grid-cols-[repeat(1,minmax(0,320px))] sm:justify-start',
  'grid-cols-1 sm:grid-cols-[repeat(2,minmax(0,320px))] sm:justify-start',
  'grid-cols-1 sm:grid-cols-[repeat(2,minmax(0,320px))] sm:justify-start lg:grid-cols-[repeat(3,minmax(0,320px))]',
  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
];

/** כרטיס מוביל רק כשיש מספיק תוצאות שיצדיקו אותו; אחרת רשת אחידה וצרה. */
export function gridPlan(count: number): GridPlan {
  return { lead: count >= 4, columns: COLUMNS[Math.min(count, 4)] };
}

/**
 * המוביל של הרשת נבחר באותה רשימת העדפה של דגל דף הבית (`lib/home.ts`) לפני
 * כלל המחיר — כך שהפריט הגדול בקטלוג ובבית הוא אותו פריט, וגם הוא מצולם מהחזית.
 */
export function pickLead(products: ProductCardData[]): ProductCardData | null {
  const eligible = products.filter((p) => !p.service && p.inStock && p.imageUrl);
  for (const want of FLAGSHIP_PREFERENCE) {
    const hit = eligible.find((p) => p.sku === want);
    if (hit) return hit;
  }
  const dearest = eligible.reduce<ProductCardData | null>((best, p) => (best && best.price >= p.price ? best : p), null);
  return dearest ?? products[0] ?? null;
}
