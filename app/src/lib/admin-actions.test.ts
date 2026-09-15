import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signSession } from './auth';

const state = vi.hoisted(() => ({ token: undefined as string | undefined, writes: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => state.token ? { value: state.token } : undefined, set: vi.fn() }) }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock('./airtable', () => ({ list: async () => [], escapeFormula: (s: string) => s }));
vi.mock('./n8n', () => ({ erpCreate: state.writes, erpUpdate: state.writes, erpOrder: state.writes, erpChat: state.writes, runWebhook: state.writes, ErpError: class extends Error {} }));

import { addTask, toggleTask } from '../app/(app)/tasks/actions';
import { createInvoice, markPaid } from '../app/(app)/invoices/actions';
import { createOrder, setOrderStatus } from '../app/(app)/orders/actions';
import { createProduct, setStock, reindexProducts } from '../app/(app)/products/actions';
import { createLead, setLeadStatus, runSalesNow } from '../app/(app)/leads/actions';
import { createCustomer } from '../app/(app)/customers/actions';
import { sendChat } from '../app/(app)/chat/actions';
import { getDailyBrief, refreshBrief } from '../app/(app)/brief/actions';

beforeEach(() => {
  vi.stubEnv('AUTH_SECRET', 'test-secret-for-admin-actions');
  state.token = undefined;
  state.writes.mockReset().mockResolvedValue({ id: 'rec1' });
});

const actions: [string, () => Promise<unknown>][] = [
  ['addTask', () => addTask(undefined, new FormData())],
  ['toggleTask', () => toggleTask('rec1', true)],
  ['createInvoice', () => createInvoice(undefined, new FormData())],
  ['markPaid', () => markPaid('rec1')],
  ['createOrder', () => createOrder(undefined, new FormData())],
  ['setOrderStatus', () => setOrderStatus('rec1', 'ORD-1', 'confirmed')],
  ['createProduct', () => createProduct(undefined, new FormData())],
  ['setStock', () => setStock('rec1', '2')],
  ['reindexProducts', () => reindexProducts()],
  ['createLead', () => createLead(undefined, new FormData())],
  ['setLeadStatus', () => setLeadStatus('rec1', 'Qualified')],
  ['runSalesNow', () => runSalesNow()],
  ['createCustomer', () => createCustomer(undefined, new FormData())],
  ['sendChat', () => sendChat('הכנסות')],
  ['getDailyBrief', () => getDailyBrief()],
  ['refreshBrief', () => refreshBrief()],
];

describe('פעולות ניהול מאמתות את הבקשה גם ללא proxy', () => {
  it.each(actions)('%s חוסמת בקשה אנונימית לפני גישה לנתונים', async (_name, action) => {
    await expect(action()).rejects.toThrow('redirect:/login');
    expect(state.writes).not.toHaveBeenCalled();
  });
  it('סשן חתום מאפשר כתיבה; סשן שפג או מפתח חסר חוסמים אותה', async () => {
    state.token = await signSession('test-secret-for-admin-actions');
    await expect(markPaid('rec1')).resolves.toMatchObject({ ok: true });
    state.token = await signSession('test-secret-for-admin-actions', -1);
    await expect(markPaid('rec1')).rejects.toThrow('redirect:/login');
    vi.stubEnv('AUTH_SECRET', '');
    await expect(markPaid('rec1')).rejects.toThrow('redirect:/login');
    expect(state.writes).toHaveBeenCalledTimes(1);
  });
});
