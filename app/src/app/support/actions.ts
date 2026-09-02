'use server';

import { cookies, headers } from 'next/headers';
import { erpSupport, ErpError } from '@/lib/n8n';
import { logError } from '@/lib/log';
import { list } from '@/lib/airtable';
import { matchProducts } from '@/lib/product-match';
import { supportLimiter } from '@/lib/rate-limit';
import type { ProductFields } from '@/lib/types';

const COOKIE = 'erp_support';

export type ProductCardData = { id: string; name: string; sku?: string; price?: number; imageUrl?: string; inStock?: boolean };
export type SupportResult = { reply?: string; error?: string; products?: ProductCardData[] };

async function sessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;
  const id = crypto.randomUUID();
  jar.set(COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return id;
}

export async function sendSupport(message: string): Promise<SupportResult> {
  const text = message.trim();
  if (!text) return { error: 'כתבו שאלה' };
  if (text.length > 500) return { error: 'ההודעה ארוכה מדי. קצרו אותה ונסו שוב.' };
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!supportLimiter.allow(ip)) return { error: 'יותר מדי הודעות. נסו שוב בעוד דקה.' };
  // כרטיסי המוצרים הם העשרה בלבד — תקלה בקטלוג לא תמחק תשובה תקינה של הסוכן
  const catalog = list<ProductFields>('Products').catch((e) => {
    logError('support.catalog', e);
    return [];
  });
  try {
    const reply = await erpSupport(text, await sessionId());
    const matched = matchProducts(reply, await catalog).map((p) => ({
      id: p.id,
      name: p.fields.Name,
      sku: p.fields.Sku,
      price: p.fields.Price,
      imageUrl: p.fields.ImageUrl,
      inStock: p.fields.InStock,
    }));
    return { reply, products: matched };
  } catch (e) {
    logError('support.reply', e);
    return { error: e instanceof ErpError ? e.message : 'השירות לא זמין כרגע. אפשר לפנות בטלגרם @aielec_support_bot.' };
  }
}
