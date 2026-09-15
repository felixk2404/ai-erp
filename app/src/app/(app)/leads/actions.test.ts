import { expect, it, vi } from 'vitest';
vi.mock('@/lib/require-session', () => ({ requireSession: async () => {} }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/log', () => ({ logError: vi.fn() }));
const { runWebhook } = vi.hoisted(() => ({ runWebhook: vi.fn() }));
vi.mock('@/lib/n8n', () => ({ runWebhook, erpCreate: vi.fn(), erpUpdate: vi.fn(), ErpError: class extends Error {} }));
import { runSalesNow } from './actions';
it('WF3 ללא לידים הוא הצלחה עם sent=0 ולא כשל בנמען', async () => {
  runWebhook.mockResolvedValue({ ok: true, sent: 0 });
  await expect(runSalesNow()).resolves.toEqual({ ok: true, message: 'אין לידים חדשים לשליחה' });
});
it('הצלחה בלי נמען ובלי sent=0 נשארת כשל בחוזה', async () => {
  runWebhook.mockResolvedValue({ ok: true });
  expect((await runSalesNow()).error).toBeTruthy();
});
