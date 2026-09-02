import 'server-only';
import { env } from './env';
import type { Rec, TableName } from './types';

/** שגיאה שהגיעה מ-n8n (ok:false) או כשל HTTP מול ה-webhook. ההודעה מוצגת למשתמש כמו שהיא. */
export class ErpError extends Error {}

type Envelope<T> = { ok?: boolean; error?: string } & T;

async function post<T>(path: string, body: unknown): Promise<Envelope<T>> {
  const { N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET } = env();
  const res = await fetch(`${N8N_WEBHOOK_URL}/${path}`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'content-type': 'application/json', 'x-erp-secret': N8N_WEBHOOK_SECRET },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: Envelope<T>;
  try {
    data = JSON.parse(text) as Envelope<T>;
  } catch {
    throw new ErpError(`n8n ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok || data.ok === false) throw new ErpError(data.error ?? `n8n ${res.status}`);
  return data;
}

export async function erpCreate<F>(table: TableName, payload: Partial<F>): Promise<Rec<F>> {
  return (await post<{ record: Rec<F> }>('erp', { action: 'create', table, payload })).record;
}

export async function erpUpdate<F>(table: TableName, id: string, payload: Partial<F>): Promise<Rec<F>> {
  return (await post<{ record: Rec<F> }>('erp', { action: 'update', table, id, payload })).record;
}

export async function erpChat(message: string, sessionId: string): Promise<string> {
  return (await post<{ reply: string }>('erp', { action: 'chat', message, sessionId })).reply;
}

export type WebhookPath = 'reindex-products' | 'reindex-policies' | 'run-sales';

export function runWebhook<T = Record<string, unknown>>(path: WebhookPath): Promise<Envelope<T>> {
  return post<T>(path, {});
}
