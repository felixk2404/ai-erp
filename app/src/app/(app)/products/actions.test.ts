import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { erpUpdate, runWebhook, ErpError } = vi.hoisted(() => ({
  erpUpdate: vi.fn(),
  runWebhook: vi.fn(),
  ErpError: class ErpError extends Error {},
}));
vi.mock('@/lib/n8n', () => ({ erpCreate: vi.fn(), erpUpdate, runWebhook, ErpError }));
vi.mock('@/lib/log', () => ({ logError: vi.fn() }));

import { reindexProducts, toggleStock } from './actions';

describe('reindexProducts', () => {
  it('says "מוצר נטען" for one product and "מוצרים נטענו" for the rest', async () => {
    runWebhook.mockImplementation(async () => ({ products: 1 }));
    await expect(reindexProducts()).resolves.toEqual({ ok: true, message: 'מוצר אחד נטען למאגר הידע של סוכן השירות' });
    runWebhook.mockImplementation(async () => ({ products: 7 }));
    await expect(reindexProducts()).resolves.toEqual({ ok: true, message: '7 מוצרים נטענו למאגר הידע של סוכן השירות' });
  });
});

describe('toggleStock', () => {
  it('names the product in both directions instead of pasting two labels together', async () => {
    erpUpdate.mockImplementation(async () => ({ id: 'rec1' }));
    await expect(toggleStock('rec1', true)).resolves.toMatchObject({ message: 'המוצר סומן במלאי' });
    await expect(toggleStock('rec1', false)).resolves.toMatchObject({ message: 'המוצר סומן כאזל' });
  });
});
