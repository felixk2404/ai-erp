'use server';

import { revalidatePath } from 'next/cache';
import { list } from '@/lib/airtable';
import { erpCreate, ErpError } from '@/lib/n8n';
import type { CustomerFields } from '@/lib/types';
import type { FormState } from '@/components/forms/entity-dialog';
import { parseCustomerForm, nextCustomerId } from './parse';

export async function createCustomer(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseCustomerForm(fd);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    const existing = await list<CustomerFields>('Customers');
    const CustomerId = nextCustomerId(existing.map((c) => c.fields.CustomerId));
    await erpCreate<CustomerFields>('Customers', { CustomerId, ...parsed.data });
  } catch (e) {
    return { error: e instanceof ErpError ? e.message : 'שגיאה ביצירת הלקוח' };
  }
  revalidatePath('/customers');
  revalidatePath('/invoices');
  return { ok: true };
}
