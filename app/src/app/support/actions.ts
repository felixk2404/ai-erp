'use server';

import { cookies, headers } from 'next/headers';
import { erpSupport, ErpError } from '@/lib/n8n';
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
  const text = message.trim().slice(0, 500);
  if (!text) return { error: 'כתוב שאלה' };
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!supportLimiter.allow(ip)) return { error: 'יותר מדי הודעות. נסו שוב בעוד דקה.' };
  try {
    const [reply, products] = await Promise.all([erpSupport(text, await sessionId()), list<ProductFields>('Products')]);
    const matched = matchProducts(reply, products).map((p) => ({
      id: p.id,
      name: p.fields.Name,
      sku: p.fields.Sku,
      price: p.fields.Price,
      imageUrl: p.fields.ImageUrl,
      inStock: p.fields.InStock,
    }));
    return { reply, products: matched };
  } catch (e) {
    return { error: e instanceof ErpError ? e.message : 'השירות לא זמין כרגע. אפשר לפנות בטלגרם @aielec_support_bot.' };
  }
}
