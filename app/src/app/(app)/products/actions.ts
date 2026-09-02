'use server';

import { revalidatePath } from 'next/cache';
import { erpCreate, erpUpdate, runWebhook, ErpError } from '@/lib/n8n';
import type { ProductFields } from '@/lib/types';
import type { FormState } from '@/components/forms/entity-dialog';
import type { ActionResult } from '@/components/forms/action-button';
import { parseProductForm } from './parse';

const msg = (e: unknown, fallback: string) => (e instanceof ErpError ? e.message : fallback);

export async function createProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseProductForm(fd);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    await erpCreate<ProductFields>('Products', parsed.data);
  } catch (e) {
    return { error: msg(e, 'שגיאה ביצירת המוצר') };
  }
  revalidatePath('/products');
  return { ok: true };
}

export async function toggleStock(id: string, inStock: boolean): Promise<ActionResult> {
  try {
    await erpUpdate<ProductFields>('Products', id, { InStock: inStock });
  } catch (e) {
    return { error: msg(e, 'עדכון המלאי נכשל') };
  }
  revalidatePath('/products');
  return { ok: true, message: inStock ? 'סומן במלאי' : 'סומן לא במלאי' };
}

export async function reindexProducts(): Promise<ActionResult> {
  try {
    const r = await runWebhook<{ products?: number }>('reindex-products');
    return { ok: true, message: `${r.products ?? 0} מוצרים נטענו למאגר הידע של סוכן השירות` };
  } catch (e) {
    return { error: msg(e, 'רענון מאגר הידע נכשל') };
  }
}
