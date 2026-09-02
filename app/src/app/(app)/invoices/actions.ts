'use server';

import { revalidatePath } from 'next/cache';
import { erpCreate, erpUpdate, ErpError } from '@/lib/n8n';
import type { InvoiceFields } from '@/lib/types';
import { parseInvoiceForm } from './parse';

export type FormState = { ok?: boolean; error?: string; errors?: Record<string, string> } | undefined;

export async function createInvoice(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseInvoiceForm(fd);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    await erpCreate<InvoiceFields>('Invoices', { ...parsed.data, Status: 'new' });
  } catch (e) {
    return { error: e instanceof ErpError ? e.message : 'שגיאה ביצירת החשבונית' };
  }
  revalidatePath('/invoices');
  revalidatePath('/');
  return { ok: true };
}

export async function markPaid(id: string) {
  await erpUpdate<InvoiceFields>('Invoices', id, { Status: 'paid' });
  revalidatePath('/invoices');
  revalidatePath('/');
}
