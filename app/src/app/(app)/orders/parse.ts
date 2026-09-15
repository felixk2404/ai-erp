import { z } from 'zod';
import { parseForm, optionalText, type ParseResult } from '@/lib/parse';
import type { OrderRequest } from '@/lib/n8n';

/** גבולות WF10 (runbook §7.1): עד 10 שורות שונות, כמות 1–99 לשורה. המחיר לא נשלח — הקטלוג קובע. */
export const MAX_LINES = 10;
export const MAX_QTY = 99;

const line = z.object({
  sku: z.string().trim().min(1).max(32),
  qty: z.number().int().min(1, 'כמות חייבת להיות לפחות 1').max(MAX_QTY, `עד ${MAX_QTY} יחידות לשורה`),
});

const schema = z.object({
  name: z.string().trim().min(2, 'צריך שם מלא').max(60, 'שם ארוך מדי'),
  // trim+lowercase לפני הבדיקה: אימייל שהודבק עם רווח או באותיות גדולות הוא תקין.
  email: z.string().trim().toLowerCase().pipe(z.email('כתובת אימייל לא תקינה')),
  // רווחים מוסרים, מקף נשאר — "050 123 4567" ו-"050-1234567" הם אותו מספר. אותו כלל כמו בחנות.
  phone: z
    .string()
    .transform((s) => s.replace(/\s+/g, ''))
    .refine((v) => /^0\d{1,2}-?\d{7}$/.test(v), 'מספר טלפון לא תקין'),
  address: z.string().trim().max(120, 'כתובת ארוכה מדי').transform(optionalText),
  city: z.string().trim().max(120, 'שם עיר ארוך מדי').transform(optionalText),
  note: z.string().trim().max(500, 'ההערה ארוכה מדי').transform(optionalText),
  items: z
    .string()
    .transform((s, ctx) => {
      try {
        return JSON.parse(s || '[]') as unknown;
      } catch {
        ctx.addIssue({ code: 'custom', message: 'שורות לא תקינות' });
        return z.NEVER;
      }
    })
    .pipe(z.array(line).min(1, 'יש להוסיף לפחות מוצר אחד').max(MAX_LINES, `אפשר עד ${MAX_LINES} מוצרים שונים בהזמנה`)),
});

/** הטופס שולח שורות כ-JSON בשדה items (מק"ט + כמות בלבד). כתובת ועיר אופציונליות כאן — WF10 דורש אותן רק לפריט פיזי ומחזיר שגיאה בעברית. */
export function parseOrderForm(fd: FormData): ParseResult<OrderRequest> {
  const r = parseForm(schema, fd, ['name', 'email', 'phone', 'address', 'city', 'note', 'items']);
  if (!r.ok) return r;
  const { name, email, phone, address, city, note, items } = r.data;
  return { ok: true, data: { customer: { name, email, phone, address, city }, items, note } };
}
