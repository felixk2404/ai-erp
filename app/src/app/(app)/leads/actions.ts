'use server';

import { requireSession } from '@/lib/require-session';

import { revalidatePath } from 'next/cache';
import { erpCreate, erpUpdate, runWebhook, ErpError } from '@/lib/n8n';
import { logError } from '@/lib/log';
import { LEAD_STATUSES, type LeadFields, type LeadStatus } from '@/lib/types';
import type { FormState } from '@/components/forms/entity-dialog';
import type { ActionResult } from '@/components/forms/action-button';
import { parseLeadForm } from './parse';

const msg = (e: unknown, fallback: string) => (e instanceof ErpError ? e.message : fallback);

export async function createLead(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireSession();
  const parsed = parseLeadForm(fd);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    await erpCreate<LeadFields>('Leads', { ...parsed.data, Source: 'manual' });
  } catch (e) {
    logError('leads.create', e);
    return { error: msg(e, 'שגיאה ביצירת הליד') };
  }
  revalidatePath('/leads');
  revalidatePath('/');
  return { ok: true };
}

export async function setLeadStatus(id: string, status: string): Promise<ActionResult> {
  await requireSession();
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) return { error: 'סטטוס לא חוקי' };
  try {
    await erpUpdate<LeadFields>('Leads', id, { Status: status as LeadStatus });
  } catch (e) {
    logError('leads.setStatus', e);
    return { error: msg(e, 'עדכון הסטטוס נכשל') };
  }
  revalidatePath('/leads');
  revalidatePath('/');
  return { ok: true, message: 'הסטטוס עודכן' };
}

export async function runSalesNow(): Promise<ActionResult> {
  await requireSession();
  try {
    const r = await runWebhook<{ sentTo?: string; sent?: number }>('run-sales');
    revalidatePath('/leads');
    if (r.sentTo) return { ok: true, message: `נשלח מייל ל-${r.sentTo}` };
    if (r.sent === 0) return { ok: true, message: 'אין לידים חדשים לשליחה' };
    // WF3 ללא לידים מחזיר sent=0 במפורש. ok בלי נמען = צורת תשובה שהשתנתה, לא "אין לידים"
    if (r.ok) {
      logError('leads.runSales shape', r);
      return { error: 'ההרצה הסתיימה בלי כתובת נמען. בדקו את ההרצה ב-n8n לפני שמריצים שוב.' };
    }
    return { ok: true, message: 'אין לידים חדשים לשליחה' };
  } catch (e) {
    logError('leads.runSales', e);
    return { error: msg(e, 'שליחת המייל נכשלה') };
  }
}
