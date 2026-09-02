'use server';

import { headers } from 'next/headers';
import { erpCall } from '@/lib/n8n';
import { createRateLimiter } from '@/lib/rate-limit';
import { CHECKOUT_FIELDS, parseCheckout, toOrderPayload, type CheckoutErrors, type OrderResult } from '@/lib/order';

/** 5 הזמנות לדקה לכל IP — כתיבה אמיתית ל-Airtable + מייל, לא רק קריאה. */
const orderLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

/** WF10 יכול לרוץ ארוך (מלאי → הזמנה → חשבונית → מייל) — 90 שניות, לא 60. */
const ORDER_TIMEOUT_MS = 90_000;

const OFFLINE = 'לא הצלחנו לשמור את ההזמנה, נסו שוב בעוד רגע';

/**
 * מצב הטופס. שטוח בכוונה: הטופס קורא `errors?.name` בלי לצמצם איחוד בכל שדה.
 * `outOfStock` נושא מק"טים בלבד — הכמות הזמינה היא מידע פנימי (runbook §7.1).
 */
export type PlaceOrderState = {
  ok?: true;
  orderNumber?: string;
  email?: string;
  error?: string;
  outOfStock?: string[];
  errors?: CheckoutErrors;
  /** מה שהוקלד, כדי שכישלון לא ימחק טופס מלא — React מאפס שדות לא מבוקרים אחרי action. */
  values?: Record<string, string>;
};

/** שולח את ההזמנה ל-WF13. המחירים לא נוסעים מהדפדפן — השרת מתמחר מהקטלוג. */
export async function placeOrder(_prev: PlaceOrderState, fd: FormData): Promise<PlaceOrderState> {
  const values = Object.fromEntries(
    CHECKOUT_FIELDS.filter((f) => f !== 'items').map((f) => [f, String(fd.get(f) ?? '')]),
  );

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!orderLimiter.allow(ip)) return { error: 'יותר מדי ניסיונות. נסו שוב בעוד דקה.', values };

  const parsed = parseCheckout(fd);
  if (!parsed.ok) return { errors: parsed.errors, values };

  try {
    const res = await erpCall<OrderResult>({ action: 'order', order: toOrderPayload(parsed.data) }, ORDER_TIMEOUT_MS);
    // HTTP 200 גם לכישלון עסקי — ההבחנה היא ב-ok, לא בסטטוס.
    if (!res.ok)
      return {
        error: res.error,
        outOfStock: res.outOfStock?.map((o) => o.sku),
        values,
      };
    return { ok: true, orderNumber: res.orderNumber, email: parsed.data.email };
  } catch {
    // רשת/timeout/סטטוס לא תקין — הלקוח רואה תקלה אחת, וההזמנה לא אבדה מהעגלה.
    return { error: OFFLINE, values };
  }
}
