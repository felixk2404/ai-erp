import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

vi.mock('./env', () => ({
  env: () => ({ N8N_WEBHOOK_URL: 'https://erp.test/webhook', N8N_WEBHOOK_SECRET: 's' }),
}));

const { erpCall, ErpError, ErpShapeError } = await import('./n8n');

const schema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), value: z.string() }),
  z.object({ ok: z.literal(false), error: z.string() }),
]);

const reply = (status: number, body: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })),
  );

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => vi.unstubAllGlobals());

describe('erpCall', () => {
  it('returns the parsed body on success', async () => {
    reply(200, { ok: true, value: 'x' });
    await expect(erpCall(schema, {})).resolves.toEqual({ ok: true, value: 'x' });
  });

  /**
   * WF13 answers 404 for "order not found" and 400 for bad input. Those are answers,
   * not outages — turning them into "the service is down" hides the one sentence the
   * customer needs, which is exactly what happened on the order-tracking page.
   */
  it('passes a 4xx business answer through instead of calling it an outage', async () => {
    reply(404, { ok: false, error: 'ההזמנה לא נמצאה' });
    await expect(erpCall(schema, {})).resolves.toEqual({ ok: false, error: 'ההזמנה לא נמצאה' });

    reply(400, { ok: false, error: 'קלט לא תקין' });
    await expect(erpCall(schema, {})).resolves.toEqual({ ok: false, error: 'קלט לא תקין' });
  });

  it('treats 5xx as an outage', async () => {
    reply(502, { ok: false, error: 'anything' });
    await expect(erpCall(schema, {})).rejects.toBeInstanceOf(ErpError);
  });

  it('treats a body that is not the contract as a shape error, whatever the status', async () => {
    reply(200, { unexpected: true });
    await expect(erpCall(schema, {})).rejects.toBeInstanceOf(ErpShapeError);

    reply(404, '<html>gateway</html>');
    await expect(erpCall(schema, {})).rejects.toBeInstanceOf(ErpShapeError);
  });
});
