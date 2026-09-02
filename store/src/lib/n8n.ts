import 'server-only';
import type { z } from 'zod';
import { env } from './env';

/** כשל בקריאה ל-n8n (רשת, timeout, או סטטוס לא תקין). */
export class ErpError extends Error {}

/**
 * התשובה הגיעה, אבל לא בצורה שהוסכמה. נפרד מ-`ErpError` כי המשמעות שונה:
 * אחרי קריאת `order` ייתכן ש-WF10 כן כתב את ההזמנה, ולכן אסור להציע "נסו שוב".
 */
export class ErpShapeError extends ErpError {}

/**
 * POST ל-WF13 (`/erp`) עם ה-secret בכותרת. timeout ברירת מחדל 60s — סוכן AI איטי.
 * הגוף *נבדק* מול סכימה ולא מומר בהצהרה: זה הגבול היחיד שהחנות לא שולטת בו,
 * ושדה שנעלם בצד השני צריך להגיע לקורא כתקלה מטופלת, לא כמסך שבור.
 */
export async function erpCall<T>(schema: z.ZodType<T>, body: Record<string, unknown>, timeoutMs = 60_000): Promise<T> {
  const { N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET } = env();
  const res = await fetch(`${N8N_WEBHOOK_URL}/erp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-erp-secret': N8N_WEBHOOK_SECRET },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: 'no-store',
  });
  if (!res.ok) throw new ErpError(`n8n ${res.status}`);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new ErpShapeError('n8n response did not match the contract');
  return parsed.data;
}
