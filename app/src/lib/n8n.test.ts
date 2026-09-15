import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('./env', () => ({ env: () => ({ N8N_WEBHOOK_URL: 'https://n8n.test/webhook', N8N_WEBHOOK_SECRET: 'shh' }) }));

import { erpCreate, erpUpdate, erpChat, erpOrder, runWebhook, ErpError } from './n8n';

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

describe('erpOrder', () => {
  beforeEach(() => vi.restoreAllMocks());
  const order = { customer: { name: 'דוד לוי', email: 'd@example.com', phone: '0500000000', address: 'הרצל 1', city: 'תל אביב' }, items: [{ sku: 'TY-PB-20', qty: 1 }] };

  it('posts the WF13 order envelope and returns the order number', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true, orderNumber: 'ORD-0042', invoiceNumber: 'INV-0050', total: 218 }));
    const r = await erpOrder(order);
    expect(r).toEqual({ orderNumber: 'ORD-0042', invoiceNumber: 'INV-0050', total: 218 });
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({ action: 'order', order });
  });

  it('surfaces the Hebrew business error from WF13 as an ErpError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: false, error: 'חלק מהפריטים אינם במלאי בכמות המבוקשת' }));
    await expect(erpOrder(order)).rejects.toThrow('חלק מהפריטים אינם במלאי');
  });

  it('rejects a 200 without an orderNumber — "saved" is never a guess', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true }));
    await expect(erpOrder(order)).rejects.toThrow(ErpError);
  });
});

describe('גבולות תשובות ומשך בקשות', () => {
  beforeEach(() => vi.restoreAllMocks());

  it.each([null, [], 42, { ok: true }, { ok: true, reply: '' }, { ok: true, reply: 42 }])('צ׳אט דוחה תשובה לא תקינה: %j', async (body) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(body));
    await expect(erpChat('שאלה', 'sess')).rejects.toBeInstanceOf(ErpError);
  });

  it('כשל בקריאת גוף התשובה נשאר שגיאה מטופלת', async () => {
    const response = new Response('partial');
    vi.spyOn(response, 'text').mockRejectedValue(new TypeError('terminated'));
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    await expect(erpChat('שאלה', 'sess')).rejects.toBeInstanceOf(ErpError);
  });

  it('צ׳אט מקבל דקה והזמנה 90 שניות לפני ביטול הבקשה', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json({ ok: true, reply: 'תשובה' }));
    await erpChat('שאלה', 'sess');
    expect(timeout).toHaveBeenLastCalledWith(60_000);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json({ ok: true, orderNumber: 'ORD-1', total: 10 }));
    await erpOrder({ customer: { name: 'שם', email: 'x@y.co', phone: '0501234567' }, items: [{ sku: 'SKU', qty: 1 }] });
    expect(timeout).toHaveBeenLastCalledWith(90_000);
  });

  it('ניתוק אחרי שליחת הזמנה מפנה לבדיקת ההזמנות ולא לניסיון חוזר', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    await expect(erpOrder({ customer: { name: 'שם', email: 'x@y.co', phone: '0501234567' }, items: [{ sku: 'SKU', qty: 1 }] })).rejects.toThrow('ייתכן שההזמנה נשמרה');
  });
});
