import { z } from 'zod';
import type { Product } from './types';

/** שורת חשבונית. נשמר ב-Airtable כ-JSON בשדה Invoices.Items. */
export const itemSchema = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  qty: z.number().int().positive(),
  price: z.number().nonnegative(),
});
export type InvoiceItem = z.infer<typeof itemSchema>;

export const itemsSchema = z.array(itemSchema).min(1, 'יש להוסיף לפחות מוצר אחד');

/** מפרסר את ה-JSON שנשמר ב-Airtable; מחזיר [] על כל קלט לא תקין (חשבוניות ישנות בלי שורות). */
export function parseItems(raw: string | undefined | null): InvoiceItem[] {
  if (!raw) return [];
  try {
    const r = itemsSchema.safeParse(JSON.parse(raw));
    return r.success ? r.data : [];
  } catch {
    return [];
  }
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const lineTotal = (i: InvoiceItem) => round2(i.qty * i.price);
export const sumItems = (items: InvoiceItem[]) => round2(items.reduce((s, i) => s + i.qty * i.price, 0));

const VAT_RATE = 0.18;
/** מחירי הקטלוג כוללים מע"מ, ולכן סכום השורות הוא הסה"כ לתשלום והמע"מ מחולץ מתוכו — אותה מוסכמה כמו בחנות וב-WF10. */
export const vatOf = (total: number) => round2(total - total / (1 + VAT_RATE));

export type ProductOption = { sku: string; name: string; price: number };

/** אפשרויות לטופס: רק מוצרים עם מק"ט ומחיר. מוצרים שלא במלאי נשארים (שירותים/הזמנות מיוחדות). */
export function toProductOptions(products: Product[]): ProductOption[] {
  return products.flatMap((p) => (p.fields.Sku && p.fields.Price != null ? [{ sku: p.fields.Sku, name: p.fields.Name, price: p.fields.Price }] : []));
}
