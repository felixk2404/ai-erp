'use server';

import { headers } from 'next/headers';
import { erpCall } from '@/lib/n8n';
import { createRateLimiter } from '@/lib/rate-limit';
import { normalizeEmail, normalizeOrderNumber } from '@/lib/order-status';
import type { TrackedOrder } from '@/lib/types';

/** 20 בירורי הזמנה לדקה לכל IP — עמוד ציבורי בלי אימות. */
const lookupLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });

export type LookupResult = { ok: true; order: TrackedOrder } | { ok: false; error: string };

export async function lookupOrder(orderNumber: string, email: string): Promise<LookupResult> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!lookupLimiter.allow(ip)) return { ok: false, error: 'יותר מדי בקשות. נסו שוב בעוד דקה.' };

  try {
    return await erpCall<LookupResult>(
      { action: 'order_status', orderNumber: normalizeOrderNumber(orderNumber), email: normalizeEmail(email) },
      30_000
    );
  } catch {
    // רשת/timeout/סטטוס לא תקין מ-n8n — כולם אותה תקלה מנקודת המבט של הלקוח.
    return { ok: false, error: 'השירות לא זמין כרגע, נסו שוב בעוד רגע' };
  }
}
