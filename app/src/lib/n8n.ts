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
const TIMEOUT_MS = 60_000;
const ORDER_UNCERTAIN = 'ייתכן שההזמנה נשמרה. בדקו ברשימת ההזמנות לפני שליחה נוספת.';

async function post<T>(path: string, body: unknown, timeoutMs = TIMEOUT_MS, unavailable = UNAVAILABLE): Promise<Envelope<T>> {
  const { N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET } = env();
  let res: Response;
  let text: string;
  try {
    res = await fetch(`${N8N_WEBHOOK_URL}/${path}`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'content-type': 'application/json', 'x-erp-secret': N8N_WEBHOOK_SECRET },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    text = await res.text();
  } catch (e) {
    logError(`n8n ${path} unreachable`, e);
    throw new ErpError(unavailable);
  }
  let data: Envelope<T>;
  try {
    data = JSON.parse(text) as Envelope<T>;
  } catch {
    logError(`n8n ${path} non-JSON`, `${res.status} ${text.slice(0, 500)}`);
    throw new ErpError(unavailable);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new ErpError(unavailable);
  if (!res.ok || data.ok === false) {
    logError(`n8n ${path} failed`, `${res.status} ${data.error ?? text.slice(0, 500)}`);
    throw new ErpError(res.status < 500 && typeof data.error === 'string' && data.error ? data.error : unavailable);
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

export type OrderRequest = {
  customer: { name: string; email: string; phone: string; address?: string; city?: string };
  items: { sku: string; qty: number }[];
  note?: string;
};
export type OrderResponse = { orderNumber: string; invoiceNumber?: string; total: number };

/**
 * הזמנה מהניהול — אותו חוזה WF13 `order` כמו בחנות (runbook §7.1), ולכן אותו WF10:
 * תמחור מהקטלוג, מספור, מלאי, חשבונית ומייל אישור ללקוח. המחיר לא נשלח מכאן לעולם.
 */
export async function erpOrder(order: OrderRequest): Promise<OrderResponse> {
  const r = await post<Partial<OrderResponse>>('erp', { action: 'order', order }, 90_000, ORDER_UNCERTAIN);
  if (typeof r.orderNumber !== 'string' || !r.orderNumber || typeof r.total !== 'number' || !Number.isFinite(r.total)) {
    logError('n8n order no orderNumber', r);
    throw new ErpError(ORDER_UNCERTAIN);
  }
  return { orderNumber: r.orderNumber, invoiceNumber: r.invoiceNumber, total: r.total ?? 0 };
}

function readReply(data: { reply?: unknown }): string {
  if (typeof data.reply !== 'string' || !data.reply.trim()) throw new ErpError(UNAVAILABLE);
  return data.reply;
}

export async function erpChat(message: string, sessionId: string): Promise<string> {
  return readReply(await post<{ reply?: unknown }>('erp', { action: 'chat', message, sessionId }));
}

/** סוכן שירות הלקוחות (RAG) — אותו סוכן כמו בטלגרם, דרך WF13. */
export async function erpSupport(message: string, sessionId: string): Promise<string> {
  return readReply(await post<{ reply?: unknown }>('erp', { action: 'support', message, sessionId }));
}

export type WebhookPath = 'reindex-products' | 'reindex-policies' | 'run-sales';

export function runWebhook<T = Record<string, unknown>>(path: WebhookPath): Promise<Envelope<T>> {
  return post<T>(path, {});
}
