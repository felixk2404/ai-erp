'use server';

import { revalidatePath } from 'next/cache';
import { list, escapeFormula } from '@/lib/airtable';
import { erpUpdate, ErpError } from '@/lib/n8n';
import { logError } from '@/lib/log';
import { ORDER_STATUSES, type OrderFields, type OrderStatus, type TaskFields } from '@/lib/types';
import type { ActionResult } from '@/components/forms/action-button';

const msg = (e: unknown, fallback: string) => (e instanceof ErpError ? e.message : fallback);

/** סוגר את משימת "לשלוח ORD-…" ש-WF10 פתח להזמנה. אין משימה פתוחה = אין מה לסגור. */
async function closeShipTask(orderNumber: string) {
  const [task] = await list<TaskFields>('Tasks', {
    filter: `AND({Source}='order',{RefId}='${escapeFormula(orderNumber)}',{Status}!='done')`,
    max: 1,
  });
  if (task) await erpUpdate<TaskFields>('Tasks', task.id, { Status: 'done' });
}

/**
 * שינוי סטטוס הזמנה. "נשלחה" הוא גם סימון שהמשלוח יצא, ולכן הוא סוגר את משימת המשלוח —
 * אחרת המנהל מעדכן פה ומוחק שם, ומשימות משלוח ישנות נערמות בתור ובתקציר של הסוכן.
 * כשל בסגירת המשימה לא מבטל את שינוי הסטטוס שכבר נשמר — הוא נאמר למשתמש כמו שהוא.
 */
export async function setOrderStatus(id: string, orderNumber: string, status: string): Promise<ActionResult> {
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) return { error: 'סטטוס לא חוקי' };
  try {
    await erpUpdate<OrderFields>('Orders', id, { Status: status as OrderStatus });
  } catch (e) {
    logError('orders.setStatus', e);
    return { error: msg(e, 'עדכון הסטטוס נכשל') };
  }

  let warning = '';
  if (status === 'shipped') {
    try {
      await closeShipTask(orderNumber);
    } catch (e) {
      logError('orders.closeShipTask', e);
      warning = ', אבל סגירת משימת המשלוח נכשלה';
    }
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${id}`);
  revalidatePath('/tasks');
  revalidatePath('/');
  return { ok: true, message: `הסטטוס עודכן${warning}` };
}
