import { z } from 'zod';
import { parseForm, optionalText } from '@/lib/parse';
import { parseStock } from '@/lib/stock';

const schema = z.object({
  Name: z.string().trim().min(1, 'יש להזין שם מוצר'),
  Sku: z.unknown().transform((v) => optionalText(v)?.toUpperCase()),
  Category: z.string().trim().min(1, 'יש להזין קטגוריה'),
  Price: z.coerce.number({ error: 'יש להזין מחיר' }).min(0, 'המחיר לא יכול להיות שלילי'),
  Description: z.unknown().transform((v) => optionalText(v) ?? ''),
  // שדה ריק = 0. `InStock` לא מגיע מהטופס יותר — הוא נגזר מהכמות ב-`createProduct`,
  // בדיוק כמו ב-`setStock`, אחרת מוצר חדש נולד עם דגל "במלאי" וכמות ריקה.
  Stock: z.unknown().transform((v, ctx) => {
    const r = parseStock(String(v ?? '').trim() || '0');
    if (r.ok) return r.value;
    ctx.addIssue({ code: 'custom', message: r.error });
    return z.NEVER;
  }),
});

export type ProductInput = z.infer<typeof schema>;
export const parseProductForm = (fd: FormData) => parseForm(schema, fd, ['Name', 'Sku', 'Category', 'Price', 'Description', 'Stock']);
