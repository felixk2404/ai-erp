'use server';

import { headers } from 'next/headers';
import { erpCall, ErpError, ErpShapeError } from '@/lib/n8n';
import { getProducts, isService } from '@/lib/catalog';
import { createRateLimiter } from '@/lib/rate-limit';
import {
  CHECKOUT_FIELDS,
  parseCheckout,
  shippingErrors,
  toOrderPayload,
  type CheckoutErrors,
  type CheckoutData,
  orderResultSchema,
} from '@/lib/order';

/** 5 הזמנות לדקה לכל IP. נספרות רק בקשות שמגיעות עד ל-n8n — טופס שנפסל בוולידציה
 *  הוא טעות של לקוח אמיתי, ואסור לו לנעול אותו מחוץ לקופה. */
const orderLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

/** WF10 יכול לרוץ ארוך (מלאי → הזמנה → חשבונית → מייל) — 90 שניות, לא 60. */
const ORDER_TIMEOUT_MS = 90_000;

const OFFLINE = 'לא הצלחנו לשמור את ההזמנה, נסו שוב בעוד רגע';
/** runbook §7.1: אחרי timeout/5xx ייתכן שההזמנה כן נשמרה — אסור להציע "נסו שוב". */
const MAYBE_SAVED =
  'משהו השתבש בדרך. ייתכן שההזמנה נשמרה. בדקו בעמוד המעקב לפי האימייל.';
/** אותו מצב בדיוק מגיע גם כגוף `ok:false` מתועד של WF13, לא רק כחריגת תעבורה. */
const MAYBE_SAVED_MARK = 'ייתכן שההזמנה נשמרה';

/**
 * מצב הטופס. שטוח בכוונה: הטופס קורא `errors?.name` בלי לצמצם איחוד בכל שדה.
 * `outOfStock` נושא מק"טים בלבד — הכמות הזמינה היא מידע פנימי (runbook §7.1).
 */
export type PlaceOrderState = {
  ok?: true;
  orderNumber?: string;
  email?: string;
  error?: string;
  /** ההזמנה אולי נשמרה — הטופס מציע מעקב במקום שליחה חוזרת. */
  maybeSaved?: true;
  outOfStock?: string[];
  errors?: CheckoutErrors;
  /** מה שהוקלד, כדי שכישלון לא ימחק טופס מלא — React מאפס שדות לא מבוקרים אחרי action. */
  values?: Record<string, string>;
};

/**
 * האם ההזמנה כוללת פריט פיזי — לפי הקטלוג, לא לפי הדגל שהדפדפן שלח.
 * כשל בקטלוג: נופלים לדגל של הדפדפן, ו-WF10 מאמת שוב בצד שלו.
 */
async function hasPhysicalLine(data: CheckoutData): Promise<boolean> {
  try {
    const products = await getProducts();
    const service = new Map(products.filter((p) => p.fields.Sku).map((p) => [p.fields.Sku!.toUpperCase(), isService(p)]));
    return data.items.some((l) => !(service.get(l.sku.toUpperCase()) ?? l.service));
  } catch {
    return data.items.some((l) => !l.service);
  }
}

/** שולח את ההזמנה ל-WF13. המחירים לא נוסעים מהדפדפן — השרת מתמחר מהקטלוג. */
export async function placeOrder(_prev: PlaceOrderState, fd: FormData): Promise<PlaceOrderState> {
  const values = Object.fromEntries(
    CHECKOUT_FIELDS.filter((f) => f !== 'items').map((f) => {
      const v = fd.get(f);
      return [f, typeof v === 'string' ? v : ''];
    }),
  );

  const parsed = parseCheckout(fd);
  if (!parsed.ok) return { errors: parsed.errors, values };

  // דרישת הכתובת נבדקת שוב מול הקטלוג: לקוח יכול לשקר ולסמן פריט פיזי כשירות.
  const shipping = shippingErrors(parsed.data, await hasPhysicalLine(parsed.data));
  if (Object.keys(shipping).length > 0) return { errors: shipping, values };

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!orderLimiter.allow(ip)) return { error: 'יותר מדי ניסיונות. נסו שוב בעוד דקה.', values };

  try {
    const res = await erpCall(orderResultSchema, { action: 'order', order: toOrderPayload(parsed.data) }, ORDER_TIMEOUT_MS);
    // HTTP 200 גם לכישלון עסקי — ההבחנה היא ב-ok, לא בסטטוס.
    if (!res.ok) {
      // WF13 מדווח "אולי נשמרה" גם בגוף תקין; הטופס חייב להתייחס אליו כמו
      // לכישלון תעבורה — להדיח את הכפתור ולהציע מעקב, לא שליחה חוזרת.
      if (res.error?.includes(MAYBE_SAVED_MARK)) return { error: res.error, maybeSaved: true, values };
      return { error: res.error, outOfStock: res.outOfStock?.map((o) => o.sku), values };
    }
    return { ok: true, orderNumber: res.orderNumber, email: parsed.data.email };
  } catch (e) {
    // timeout, 5xx או תשובה שלא תואמת את החוזה: ייתכן ש-WF10 כבר כתב את ההזמנה.
    // כל שאר התקלות — ניסיון חוזר בטוח.
    const maybeSaved =
      (e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')) ||
      e instanceof ErpShapeError ||
      (e instanceof ErpError && /^n8n 5\d\d$/.test(e.message));
    return maybeSaved ? { error: MAYBE_SAVED, maybeSaved: true, values } : { error: OFFLINE, values };
  }
}
