'use server';

import { revalidatePath } from 'next/cache';
import { erpCreate, erpUpdate, runWebhook, ErpError } from '@/lib/n8n';
import { logError } from '@/lib/log';
import type { ProductFields } from '@/lib/types';
import { parseStock } from '@/lib/stock';
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
    logError('products.create', e);
    return { error: msg(e, 'שגיאה ביצירת המוצר') };
  }
  revalidatePath('/products');
  return { ok: true };
}

export async function toggleStock(id: string, inStock: boolean): Promise<ActionResult> {
  try {
    await erpUpdate<ProductFields>('Products', id, { InStock: inStock });
  } catch (e) {
    logError('products.toggleStock', e);
    return { error: msg(e, 'עדכון המלאי נכשל') };
  }
  revalidatePath('/products');
  return { ok: true, message: inStock ? 'המוצר סומן במלאי' : 'המוצר סומן כאזל' };
}

/**
 * הכמות מגיעה כמחרוזת מהשדה ונבדקת כאן — השדה בצד הלקוח הוא נוחות, לא שער.
 * `InStock` נגזר מהכמות באותה כתיבה, אחרת החנות (`catalog-filter.inStock`) והדגל
 * הישן מספרים שני סיפורים על אותו מוצר.
 */
export async function setStock(id: string, input: string): Promise<ActionResult> {
  const parsed = parseStock(input);
  if (!parsed.ok) return { error: parsed.error };
  try {
    await erpUpdate<ProductFields>('Products', id, { Stock: parsed.value, InStock: parsed.value > 0 });
  } catch (e) {
    logError('products.setStock', e);
    return { error: msg(e, 'עדכון המלאי נכשל') };
  }
  revalidatePath('/products');
  return { ok: true };
}

export async function reindexProducts(): Promise<ActionResult> {
  try {
    const r = await runWebhook<{ products?: number }>('reindex-products');
    // "0 מוצרים נטענו" מתחת לוי ירוק זה דיווח הצלחה על כלום
    if (typeof r.products !== 'number') {
      logError('products.reindex shape', r);
      return { error: 'הרענון רץ אבל לא דיווח כמה מוצרים נטענו. בדקו את ההרצה ב-n8n.' };
    }
    return { ok: true, message: `${r.products === 1 ? 'מוצר אחד נטען' : `${r.products} מוצרים נטענו`} למאגר הידע של סוכן השירות` };
  } catch (e) {
    logError('products.reindex', e);
    return { error: msg(e, 'רענון מאגר הידע נכשל') };
  }
}
