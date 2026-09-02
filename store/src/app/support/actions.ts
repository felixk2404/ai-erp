'use server';

import { cookies, headers } from 'next/headers';
import { erpCall } from '@/lib/n8n';
import { getProducts, isService, inStock } from '@/lib/catalog';
import { matchProducts } from '@/lib/product-match';
import { supportLimiter } from '@/lib/rate-limit';

const COOKIE = 'aie_support';
const WEEK = 60 * 60 * 24 * 7;
const OFFLINE = 'השירות לא זמין כרגע. אפשר לפנות בטלגרם @aielec_support_bot';

/** מוצר שהוזכר בתשובת הסוכן. אין כאן כמות מלאי — רק "יש / אין", כמו בכל החנות. */
export type SupportProduct = {
  sku: string;
  name: string;
  price: number;
  imageUrl?: string;
  inStock: boolean;
  service: boolean;
};

export type SupportResult = { reply?: string; products?: SupportProduct[]; error?: string };

/** מזהה שיחה יציב לכל דפדפן. WF13 מוסיף לו קידומת `web-` ומנהל את הזיכרון בצד השרת. */
async function sessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;
  const id = crypto.randomUUID();
  jar.set(COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: WEEK });
  return id;
}

/**
 * שולח שאלה לסוכן השירות (WF13 `support`) ומחזיר את התשובה עם המוצרים שהוזכרו בה.
 * ההיסטוריה נשמרת בצד השרת לפי `sessionId` — הדפדפן לא שולח שיחה קודמת.
 */
export async function sendSupport(
  message: string,
  context?: { sku?: string; page?: string },
): Promise<SupportResult> {
  const text = message.trim().slice(0, 500);
  if (!text) return { error: 'כתבו שאלה' };

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!supportLimiter.allow(ip)) return { error: 'יותר מדי הודעות. נסו שוב בעוד דקה.' };

  // ההקשר נוסע כחלק מההודעה — חוזה WF13 מכיר רק message/sessionId.
  const where = [context?.sku && `מק"ט ${context.sku}`, context?.page && `עמוד ${context.page}`].filter(Boolean).join(', ');

  try {
    const [res, products] = await Promise.all([
      erpCall<{ ok: boolean; reply?: string; error?: string }>(
        { action: 'support', message: where ? `${text}\n[הקשר: ${where}]` : text, sessionId: await sessionId() },
        60_000,
      ),
      // כשל בקטלוג לא אמור לבלוע תשובה תקינה של הסוכן — פשוט בלי כרטיסי מוצר.
      getProducts().catch(() => []),
    ]);
    if (!res.ok || !res.reply) return { error: res.error || OFFLINE };

    const matched = matchProducts(res.reply, products)
      .filter((p) => p.fields.Sku && p.fields.Price != null)
      .map((p) => ({
        sku: p.fields.Sku!,
        name: p.fields.Name,
        price: p.fields.Price!,
        imageUrl: p.fields.ImageUrl,
        inStock: inStock(p),
        service: isService(p),
      }));
    return { reply: res.reply, products: matched };
  } catch {
    return { error: OFFLINE };
  }
}
