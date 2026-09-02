import 'server-only';
import { env } from './env';
import { logError } from './log';
import type { Rec, TableName } from './types';

/** שגיאה שמוצגת למשתמש כמו שהיא — הודעה בעברית מ-n8n, או משפט כללי כשהשירות לא ענה. */
export class ErpError extends Error {}

/** מה שהמשתמש רואה כשהשירות לא זמין. הסיבה האמיתית (סטטוס, גוף התשובה, חריגה) נרשמת ללוג בלבד. */
const UNAVAILABLE = 'השירות לא זמין כרגע. נסו שוב בעוד רגע.';

type Envelope<T> = { ok?: boolean; error?: string } & T;

/** הרצת סוכן ב-n8n לוקחת 10–60 שניות לגיטימיות, אבל טאנל מת לא עונה לעולם — זו התקרה. */
const TIMEOUT_MS = 20_000;

async function post<T>(path: string, body: unknown): Promise<Envelope<T>> {
  const { N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET } = env();
  let res: Response;
  try {
    res = await fetch(`${N8N_WEBHOOK_URL}/${path}`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'content-type': 'application/json', 'x-erp-secret': N8N_WEBHOOK_SECRET },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    logError(`n8n ${path} unreachable`, e);
    throw new ErpError(UNAVAILABLE);
  }
  const text = await res.text();
  let data: Envelope<T>;
  try {
    data = JSON.parse(text) as Envelope<T>;
  } catch {
    logError(`n8n ${path} non-JSON`, `${res.status} ${text.slice(0, 500)}`);
    throw new ErpError(UNAVAILABLE);
  }
  if (!res.ok || data.ok === false) {
    logError(`n8n ${path} failed`, `${res.status} ${data.error ?? text.slice(0, 500)}`);
    throw new ErpError(data.error ?? UNAVAILABLE);
  }
  return data;
}

/** כתיבה מוצלחת חייבת להחזיר רשומה. בלעדיה "נשמר" הוא ניחוש, והמשתמש היה מקבל טוסט ירוק על כלום. */
async function postRecord<F>(body: unknown): Promise<Rec<F>> {
  const rec = (await post<{ record: Rec<F> }>('erp', body)).record;
  if (!rec?.id) {
    logError('n8n erp no record', body);
    throw new ErpError('הפעולה כנראה לא בוצעה — n8n לא החזיר רשומה. בדקו את ההרצה ב-n8n.');
  }
  return rec;
}

export async function erpCreate<F>(table: TableName, payload: Partial<F>): Promise<Rec<F>> {
  return postRecord<F>({ action: 'create', table, payload });
}

export async function erpUpdate<F>(table: TableName, id: string, payload: Partial<F>): Promise<Rec<F>> {
  return postRecord<F>({ action: 'update', table, id, payload });
}

export async function erpChat(message: string, sessionId: string): Promise<string> {
  return (await post<{ reply: string }>('erp', { action: 'chat', message, sessionId })).reply;
}

/** סוכן שירות הלקוחות (RAG) — אותו סוכן כמו בטלגרם, דרך WF13. */
export async function erpSupport(message: string, sessionId: string): Promise<string> {
  return (await post<{ reply: string }>('erp', { action: 'support', message, sessionId })).reply;
}

export type WebhookPath = 'reindex-products' | 'reindex-policies' | 'run-sales';

export function runWebhook<T = Record<string, unknown>>(path: WebhookPath): Promise<Envelope<T>> {
  return post<T>(path, {});
}
