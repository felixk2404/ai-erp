import { z } from 'zod';
import { MAX_LINES, MAX_QTY } from './cart';
import type { OrderItem } from './types';

/** שדות הטופס שיכולים לקבל שגיאה. הסדר כאן הוא סדר המיקוד בטופס. */
export const CHECKOUT_FIELDS = ['name', 'email', 'phone', 'address', 'city', 'note', 'items'] as const;
export type CheckoutField = (typeof CHECKOUT_FIELDS)[number];
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

/** שורה כפי שהדפדפן שולח אותה — בלי מחיר. המחיר תמיד נלקח מהקטלוג בצד השרת. */
const lineSchema = z.object({
  sku: z.string().trim().min(1).max(32),
  qty: z.number().int().min(1).max(MAX_QTY),
  service: z.boolean(),
});

/**
 * כתובת ועיר נדרשות רק כשיש פריט פיזי. מספיק שהשדה מלא — אימות הכתובת עצמה
 * הוא לא תפקידו של הדפדפן. `physical` נגזר בשרת מהקטלוג, לא מהדפדפן.
 */
export function shippingErrors(v: { address?: string; city?: string }, physical: boolean): CheckoutErrors {
  if (!physical) return {};
  return { ...(v.address ? {} : { address: 'נדרש למשלוח' }), ...(v.city ? {} : { city: 'נדרש למשלוח' }) };
}

const schema = z
  .object({
    name: z.string().trim().min(2, 'צריך שם מלא').max(60, 'שם ארוך מדי'),
    // trim+lowercase לפני הבדיקה: אימייל שהודבק עם רווח או באותיות גדולות הוא תקין.
    email: z.string().trim().toLowerCase().pipe(z.email('כתובת אימייל לא תקינה')),
    // רווחים מוסרים, מקף נשאר — "050 123 4567" ו-"050-1234567" הם אותו מספר.
    phone: z
      .string()
      .transform((s) => s.replace(/\s+/g, ''))
      .refine((v) => /^0\d{1,2}-?\d{7}$/.test(v), 'מספר טלפון לא תקין'),
    address: z.string().trim().max(120, 'כתובת ארוכה מדי').optional(),
    city: z.string().trim().max(120, 'שם עיר ארוך מדי').optional(),
    note: z.string().trim().max(500, 'ההערה ארוכה מדי').optional(),
    items: z
      .string()
      .transform((s, ctx) => {
        try {
          return JSON.parse(s) as unknown;
        } catch {
          ctx.addIssue({ code: 'custom', message: 'הסל ריק' });
          return z.NEVER;
        }
      })
      .pipe(z.array(lineSchema).min(1, 'הסל ריק').max(MAX_LINES, `עד ${MAX_LINES} מוצרים שונים בהזמנה`)),
  })
  .superRefine((v, ctx) => {
    // הדגל `service` מהדפדפן הוא רק רמז לטופס; השרת גוזר אותו מהקטלוג ובודק שוב.
    for (const [field, message] of Object.entries(shippingErrors(v, v.items.some((l) => !l.service)))) {
      ctx.addIssue({ code: 'custom', path: [field], message: message! });
    }
  });

export type CheckoutData = z.infer<typeof schema>;
export type CheckoutParse = { ok: true; data: CheckoutData } | { ok: false; errors: CheckoutErrors };

/** גוף ה-`order` של WF13 (runbook §7.1) — לקוח + מק"ט/כמות בלבד. */
export type OrderPayload = {
  customer: { name: string; email: string; phone: string; address?: string; city?: string };
  items: { sku: string; qty: number }[];
  note?: string;
};

/** תשובת WF13 ל-`action: 'order'` — HTTP 200 בשני המקרים, ההבדל הוא ב-`ok`. */
export type OrderResult =
  | {
      ok: true;
      orderNumber: string;
      invoiceNumber: string;
      total: number;
      subtotal: number;
      shipping: number;
      vat: number;
      items: OrderItem[];
    }
  | { ok: false; error: string; outOfStock?: { sku: string; name: string; available: number }[] };

/** FormData → נתוני קופה מאומתים, או שגיאה אחת לכל שדה (הראשונה שנמצאה). */
export function parseCheckout(fd: FormData): CheckoutParse {
  // ערך שאינו מחרוזת (File) לא מומר ל-"[object File]" — הוא פשוט לא נשלח.
  const raw = Object.fromEntries(
    CHECKOUT_FIELDS.map((f) => {
      const v = fd.get(f);
      return [f, typeof v === 'string' ? v : ''];
    }),
  );
  const res = schema.safeParse(raw);
  if (res.success) return { ok: true, data: res.data };

  const errors: CheckoutErrors = {};
  for (const issue of res.error.issues) {
    const field = issue.path[0] as CheckoutField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}

/** בונה את גוף ההזמנה ל-WF13. מחירים מהדפדפן נזרקים כאן, לא בשרת המרוחק. */
export function toOrderPayload(d: CheckoutData): OrderPayload {
  return {
    customer: {
      name: d.name,
      email: d.email,
      phone: d.phone,
      ...(d.address ? { address: d.address } : {}),
      ...(d.city ? { city: d.city } : {}),
    },
    items: d.items.map(({ sku, qty }) => ({ sku, qty })),
    ...(d.note ? { note: d.note } : {}),
  };
}
