import type { Product } from './types';

const norm = (s: string) => s.toLowerCase().replace(/[־‐-―]/g, '-').replace(/\s+/g, ' ').trim();

/** אילו מוצרים מוזכרים בתשובת הסוכן: לפי מק"ט, לפי שם מלא, או לפי "מודל" (המילים הלטיניות בשם). עד 3, לפי סדר ההופעה. */
export function matchProducts(reply: string, products: Product[], max = 3): Product[] {
  const text = norm(reply);
  const found: { idx: number; p: Product }[] = [];
  for (const p of products) {
    const keys = new Set<string>();
    const name = p.fields.Name ?? ''; // איירטייבל משמיט שדות ריקים — שורת קטלוג בלי שם לא מפילה את סוכן השירות
    if (p.fields.Sku) keys.add(norm(p.fields.Sku));
    if (name) keys.add(norm(name));
    const model = name.match(/[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z0-9][A-Za-z0-9-]*)*/g)?.map(norm).filter((m) => m.length >= 4) ?? [];
    for (const m of model) keys.add(m);
    let idx = -1;
    for (const k of keys) {
      const i = text.indexOf(k);
      if (i !== -1 && (idx === -1 || i < idx)) idx = i;
    }
    if (idx !== -1) found.push({ idx, p });
  }
  return found
    .sort((a, b) => a.idx - b.idx)
    .slice(0, max)
    .map((x) => x.p);
}
