import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { erpUpdate, ErpError, list } = vi.hoisted(() => ({ erpUpdate: vi.fn(), ErpError: class ErpError extends Error {}, list: vi.fn() }));
vi.mock('@/lib/n8n', () => ({ erpUpdate, ErpError }));
vi.mock('@/lib/airtable', () => ({ list, escapeFormula: (s: string) => s }));
vi.mock('@/lib/log', () => ({ logError: vi.fn() }));

import { setOrderStatus } from './actions';

beforeEach(() => {
  vi.clearAllMocks();
  erpUpdate.mockResolvedValue({ id: 'rec1' });
  list.mockResolvedValue([]);
});

describe('setOrderStatus', () => {
  it('rejects a status that is not one of the order statuses, without calling the ERP', async () => {
    await expect(setOrderStatus('rec1', 'ORD-0001', 'paid')).resolves.toEqual({ error: 'סטטוס לא חוקי' });
    expect(erpUpdate).not.toHaveBeenCalled();
  });

  it('updates the order and leaves tasks alone for a non-shipping status', async () => {
    await expect(setOrderStatus('rec1', 'ORD-0001', 'delivered')).resolves.toEqual({ ok: true, message: 'הסטטוס עודכן' });
    expect(erpUpdate).toHaveBeenCalledExactlyOnceWith('Orders', 'rec1', { Status: 'delivered' });
    expect(list).not.toHaveBeenCalled();
  });

  // הכלל: "נשלחה" באפליקציה = המשלוח יצא, ולכן משימת "לשלוח ORD-…" של WF10 נסגרת איתו.
  it('closes the open ship task when the order becomes shipped', async () => {
    list.mockResolvedValue([{ id: 'recTask', fields: { Title: 'לשלוח ORD-0001' } }]);
    await expect(setOrderStatus('rec1', 'ORD-0001', 'shipped')).resolves.toEqual({ ok: true, message: 'הסטטוס עודכן' });
    expect(list).toHaveBeenCalledWith('Tasks', { filter: "AND({Source}='order',{RefId}='ORD-0001',{Status}!='done')", max: 1 });
    expect(erpUpdate).toHaveBeenNthCalledWith(2, 'Tasks', 'recTask', { Status: 'done' });
  });

  it('is fine when the order has no open ship task', async () => {
    await expect(setOrderStatus('rec1', 'ORD-0001', 'shipped')).resolves.toEqual({ ok: true, message: 'הסטטוס עודכן' });
    expect(erpUpdate).toHaveBeenCalledTimes(1);
  });

  // הסטטוס כבר נשמר — בליעת הכשל היתה משאירה משימת משלוח פתוחה בלי שאיש יידע.
  it('still reports success but names the task failure when closing it blows up', async () => {
    list.mockResolvedValue([{ id: 'recTask', fields: {} }]);
    erpUpdate.mockResolvedValueOnce({ id: 'rec1' }).mockRejectedValueOnce(new Error('boom'));
    await expect(setOrderStatus('rec1', 'ORD-0001', 'shipped')).resolves.toEqual({
      ok: true,
      message: 'הסטטוס עודכן, אבל סגירת משימת המשלוח נכשלה',
    });
  });

  it('surfaces the ERP message when the order update itself fails', async () => {
    erpUpdate.mockRejectedValue(new ErpError('טבלה לא מורשית'));
    await expect(setOrderStatus('rec1', 'ORD-0001', 'shipped')).resolves.toEqual({ error: 'טבלה לא מורשית' });
  });

  it('falls back to a hebrew error for a non-ERP failure', async () => {
    erpUpdate.mockRejectedValue(new TypeError('fetch failed'));
    await expect(setOrderStatus('rec1', 'ORD-0001', 'shipped')).resolves.toEqual({ error: 'עדכון הסטטוס נכשל' });
  });
});
