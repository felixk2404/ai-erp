import { z } from 'zod';
import { itemsSchema, round2, sumItems, vatOf, type InvoiceItem } from '@/lib/invoice-items';

const schema = z.object({
  CustomerId: z.string().trim().min(1, 'יש לבחור לקוח'),
  Items: z
    .string()
    .transform((s, ctx) => {
      try {
        return JSON.parse(s || '[]') as unknown;
      } catch {
        ctx.addIssue({ code: 'custom', message: 'שורות לא תקינות' });
        return z.NEVER;
      }
    })
    .pipe(itemsSchema),
});

export type InvoiceInput = { CustomerId: string; Items: string; Amount: number; VatAmount: number; Total: number };
export type ParseResult<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };

/** הטופס שולח שורות כ-JSON בשדה Items; הסכומים מחושבים כאן בשרת, לא נלקחים מהלקוח.
 *  מחירי הקטלוג כוללים מע"מ, ולכן סכום השורות הוא Total והמע"מ מחולץ מתוכו — כך שסכום השורות בחשבונית שווה בדיוק לסה"כ לתשלום. */
export function parseInvoiceForm(fd: FormData): ParseResult<InvoiceInput> {
  const r = schema.safeParse({ CustomerId: fd.get('CustomerId') ?? '', Items: fd.get('Items') ?? '' });
  if (r.success) {
    const items: InvoiceItem[] = r.data.Items;
    const Total = sumItems(items);
    const VatAmount = vatOf(Total);
    return { ok: true, data: { CustomerId: r.data.CustomerId, Items: JSON.stringify(items), Amount: round2(Total - VatAmount), VatAmount, Total } };
  }
  const errors: Record<string, string> = {};
  for (const i of r.error.issues) errors[String(i.path[0])] ??= i.message;
  return { ok: false, errors };
}
