'use server';

import { revalidatePath } from 'next/cache';
import { erpCreate, erpUpdate, ErpError } from '@/lib/n8n';
import { logError } from '@/lib/log';
import type { InvoiceFields } from '@/lib/types';
import type { ActionResult } from '@/components/forms/action-button';
import { parseInvoiceForm } from './parse';

export type FormState = { ok?: boolean; error?: string; errors?: Record<string, string> } | undefined;

export async function createInvoice(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseInvoiceForm(fd);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    await erpCreate<InvoiceFields>('Invoices', { ...parsed.data, Status: 'new' });
  } catch (e) {
    logError('invoices.create', e);
    return { error: e instanceof ErpError ? e.message : 'שגיאה ביצירת החשבונית' };
  }
  revalidatePath('/invoices');
  revalidatePath('/');
  return { ok: true };
}

export async function markPaid(id: string): Promise<ActionResult> {
  try {
    await erpUpdate<InvoiceFields>('Invoices', id, { Status: 'paid' });
  } catch (e) {
    logError('invoices.markPaid', e);
    return { error: e instanceof ErpError ? e.message : 'סימון החשבונית כשולמה נכשל' };
  }
  revalidatePath('/invoices');
  revalidatePath('/');
  return { ok: true, message: 'החשבונית סומנה כשולמה' };
}
