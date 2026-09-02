import 'server-only';
import { env } from './env';

/** כשל בקריאה ל-n8n (רשת, timeout, או סטטוס לא תקין). */
export class ErpError extends Error {}

/** POST ל-WF13 (`/erp`) עם ה-secret בכותרת. timeout ברירת מחדל 60s — סוכן AI איטי. */
export async function erpCall<T extends { ok: boolean }>(
  body: Record<string, unknown>,
  timeoutMs = 60_000,
): Promise<T> {
  const { N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET } = env();
  const res = await fetch(`${N8N_WEBHOOK_URL}/erp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-erp-secret': N8N_WEBHOOK_SECRET },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: 'no-store',
  });
  if (!res.ok) throw new ErpError(`n8n ${res.status}`);
  return (await res.json()) as T;
}
