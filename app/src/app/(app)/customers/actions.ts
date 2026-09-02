'use server';

import { revalidatePath } from 'next/cache';
import { list } from '@/lib/airtable';
import { erpCreate, ErpError } from '@/lib/n8n';
import { logError } from '@/lib/log';
import type { CustomerFields } from '@/lib/types';
import type { FormState } from '@/components/forms/entity-dialog';
import { parseCustomerForm, nextCustomerId } from './parse';

export async function createCustomer(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseCustomerForm(fd);
  if (!parsed.ok) return { errors: parsed.errors };
  // שתי פעולות, שתי הודעות: קריאה שנכשלה דיווחה עד עכשיו שהיצירה נכשלה — לפני שהיא בכלל נוסתה
  let CustomerId: string;
  try {
    const existing = await list<CustomerFields>('Customers');
    CustomerId = nextCustomerId(existing.map((c) => c.fields.CustomerId));
  } catch (e) {
    logError('customers.list', e);
    return { error: 'לא הצלחנו לקרוא את רשימת הלקוחות, אז הלקוח לא נוצר. נסו שוב בעוד רגע.' };
  }
  try {
    await erpCreate<CustomerFields>('Customers', { CustomerId, ...parsed.data });
  } catch (e) {
    logError('customers.create', e);
    return { error: e instanceof ErpError ? e.message : 'שגיאה ביצירת הלקוח' };
  }
  revalidatePath('/customers');
  revalidatePath('/invoices');
  return { ok: true };
}
