import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { erpUpdate, ErpError } = vi.hoisted(() => ({ erpUpdate: vi.fn(), ErpError: class ErpError extends Error {} }));
vi.mock('@/lib/n8n', () => ({ erpCreate: vi.fn(), erpUpdate, ErpError }));
vi.mock('@/lib/log', () => ({ logError: vi.fn() }));

import { markPaid } from './actions';

describe('markPaid', () => {
  it('marks the invoice paid and reports it in feminine hebrew', async () => {
    erpUpdate.mockResolvedValue({ id: 'rec1' });
    await expect(markPaid('rec1')).resolves.toEqual({ ok: true, message: 'החשבונית סומנה כשולמה' });
    expect(erpUpdate).toHaveBeenCalledWith('Invoices', 'rec1', { Status: 'paid' });
  });

  // הבאג שהדוח מצא: בלי try/catch כשל חולף מפיל את עמוד החשבוניות במקום להציג טוסט.
  it('resolves with a hebrew error instead of throwing when erpUpdate fails', async () => {
    erpUpdate.mockImplementation(async () => { throw new TypeError('fetch failed'); });
    await expect(markPaid('rec1')).resolves.toEqual({ error: 'סימון החשבונית כשולמה נכשל' });
  });

  it("surfaces the ERP's own message when it is an ErpError", async () => {
    erpUpdate.mockImplementation(async () => { throw new ErpError('invoice already paid'); });
    await expect(markPaid('rec1')).resolves.toEqual({ error: 'invoice already paid' });
  });
});
