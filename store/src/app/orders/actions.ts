'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { erpCall } from '@/lib/n8n';
import { createRateLimiter } from '@/lib/rate-limit';
import { normalizeEmail, normalizeOrderNumber } from '@/lib/order-status';
import { lookupResultSchema, type LookupResult } from '@/lib/order';

/** 20 בירורי הזמנה לדקה לכל IP — עמוד ציבורי בלי אימות. */
const lookupLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });

/**
 * גבולות הקלט. מספר הזמנה כבר עבר נרמול ל-`[A-Z0-9-]`, ולכן נשאר רק האורך;
 * 254 הוא האורך המרבי של כתובת דואר לפי RFC 5321.
 */
const lookupSchema = z.object({
  orderNumber: z.string().min(1).max(32),
  email: z.email().max(254),
});

/** קלט פסול מקבל בדיוק את התשובה של "לא נמצאה" — בלי אורקל שמלמד מה תקין. */
const NOT_FOUND = 'ההזמנה לא נמצאה';

export type { LookupResult };

export async function lookupOrder(orderNumber: string, email: string): Promise<LookupResult> {
  // הוולידציה לפני המונה: טעות הקלדה של לקוח אמיתי לא אמורה לשרוף לו את המכסה.
  const parsed = lookupSchema.safeParse({
    orderNumber: normalizeOrderNumber(orderNumber),
    email: normalizeEmail(email),
  });
  if (!parsed.success) return { ok: false, error: NOT_FOUND };

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!lookupLimiter.allow(ip)) return { ok: false, error: 'יותר מדי בקשות. נסו שוב בעוד דקה.' };

  try {
    return await erpCall(lookupResultSchema, { action: 'order_status', ...parsed.data }, 30_000);
  } catch {
    // רשת/timeout/סטטוס לא תקין/תשובה לא תואמת חוזה — הכל אותה תקלה מנקודת המבט של הלקוח.
    return { ok: false, error: 'השירות לא זמין כרגע, נסו שוב בעוד רגע' };
  }
}
