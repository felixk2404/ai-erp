'use server';

import { revalidatePath } from 'next/cache';
import { erpCreate, erpUpdate, runWebhook, ErpError } from '@/lib/n8n';
import { LEAD_STATUSES, type LeadFields, type LeadStatus } from '@/lib/types';
import type { FormState } from '@/components/forms/entity-dialog';
import type { ActionResult } from '@/components/forms/action-button';
import { parseLeadForm } from './parse';

const msg = (e: unknown, fallback: string) => (e instanceof ErpError ? e.message : fallback);

export async function createLead(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseLeadForm(fd);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    await erpCreate<LeadFields>('Leads', parsed.data);
  } catch (e) {
    return { error: msg(e, 'שגיאה ביצירת הליד') };
  }
  revalidatePath('/leads');
  revalidatePath('/');
  return { ok: true };
}

export async function setLeadStatus(id: string, status: string): Promise<ActionResult> {
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) return { error: 'סטטוס לא חוקי' };
  try {
    await erpUpdate<LeadFields>('Leads', id, { Status: status as LeadStatus });
  } catch (e) {
    return { error: msg(e, 'עדכון הסטטוס נכשל') };
  }
  revalidatePath('/leads');
  revalidatePath('/');
  return { ok: true, message: 'הסטטוס עודכן' };
}

export async function runSalesNow(): Promise<ActionResult> {
  try {
    const r = await runWebhook<{ sentTo?: string }>('run-sales');
    revalidatePath('/leads');
    return { ok: true, message: r.sentTo ? `נשלח מייל ל-${r.sentTo}` : 'אין לידים חדשים לשליחה' };
  } catch (e) {
    return { error: msg(e, 'שליחת המייל נכשלה') };
  }
}
