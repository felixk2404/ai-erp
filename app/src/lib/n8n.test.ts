import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('./env', () => ({ env: () => ({ N8N_WEBHOOK_URL: 'https://n8n.test/webhook', N8N_WEBHOOK_SECRET: 'shh' }) }));

import { erpCreate, erpUpdate, erpChat, runWebhook, ErpError } from './n8n';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('n8n client', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('erpCreate posts action/table/payload with the secret header and returns the record', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(json({ ok: true, record: { id: 'rec1', createdTime: 't', fields: { Title: 'x' } } }));
    const rec = await erpCreate('Tasks', { Title: 'x' });
    expect(rec.id).toBe('rec1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://n8n.test/webhook/erp');
    expect((init!.headers as Record<string, string>)['x-erp-secret']).toBe('shh');
    expect(JSON.parse(init!.body as string)).toEqual({ action: 'create', table: 'Tasks', payload: { Title: 'x' } });
  });

  it('erpUpdate sends the record id', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(json({ ok: true, record: { id: 'rec1', createdTime: 't', fields: { Status: 'done' } } }));
    const rec = await erpUpdate('Tasks', 'rec1', { Status: 'done' });
    expect(rec.fields).toEqual({ Status: 'done' });
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({
      action: 'update',
      table: 'Tasks',
      id: 'rec1',
      payload: { Status: 'done' },
    });
  });

  it('erpChat returns the reply', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true, reply: 'שלום' }));
    expect(await erpChat('מה ההכנסות?', 'sess')).toBe('שלום');
  });

  it('throws ErpError on ok:false and on non-JSON http errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json({ ok: false, error: 'unknown action: x' }, 400));
    await expect(erpCreate('Tasks', {})).rejects.toBeInstanceOf(ErpError);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('gateway', { status: 502 }));
    await expect(runWebhook('run-sales')).rejects.toBeInstanceOf(ErpError);
  });

  it('keeps the upstream body and status out of the message shown to the user', async () => {
    const html = '<!DOCTYPE html><html lang="en-US">ngrok tunnel not found</html>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(html, { status: 502 }));
    const e = (await erpChat('שאלה', 'sess').catch((x) => x)) as Error;
    expect(e).toBeInstanceOf(ErpError);
    expect(e.message).not.toMatch(/DOCTYPE|ngrok|502/);
    expect(e.message).toMatch(/[א-ת]/);
  });

  it('surfaces a timeout as a Hebrew ErpError, not a raw TimeoutError', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' }));
    const e = (await erpChat('שאלה', 'sess').catch((x) => x)) as Error;
    expect(e).toBeInstanceOf(ErpError);
    expect(e.message).toMatch(/[א-ת]/);
    expect(e.message).not.toMatch(/timeout|abort/i);
  });

  it('aborts the request instead of hanging on a dead tunnel', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true, reply: 'ok' }));
    await erpChat('שאלה', 'sess');
    expect(f.mock.calls[0][1]!.signal).toBeInstanceOf(AbortSignal);
  });

  it('rejects when n8n reports success without a record — a write that did nothing', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ ok: true }));
    await expect(erpCreate('Tasks', { Title: 'x' })).rejects.toBeInstanceOf(ErpError);
    await expect(erpUpdate('Tasks', 'rec1', { Status: 'done' })).rejects.toBeInstanceOf(ErpError);
  });

  it('rejects when the returned record has no id', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true, record: { fields: { Title: 'x' } } }));
    await expect(erpCreate('Tasks', { Title: 'x' })).rejects.toBeInstanceOf(ErpError);
  });
});
