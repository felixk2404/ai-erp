import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { erpCreate, erpUpdate, runWebhook, ErpError } = vi.hoisted(() => ({
  erpCreate: vi.fn(),
  erpUpdate: vi.fn(),
  runWebhook: vi.fn(),
  ErpError: class ErpError extends Error {},
}));
vi.mock('@/lib/n8n', () => ({ erpCreate, erpUpdate, runWebhook, ErpError }));
vi.mock('@/lib/log', () => ({ logError: vi.fn() }));

import { createProduct, reindexProducts, setStock } from './actions';

beforeEach(() => {
  erpCreate.mockReset().mockImplementation(async () => ({ id: 'rec1' }));
  erpUpdate.mockReset().mockImplementation(async () => ({ id: 'rec1' }));
});

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe('reindexProducts', () => {
  it('says "מוצר נטען" for one product and "מוצרים נטענו" for the rest', async () => {
    runWebhook.mockImplementation(async () => ({ products: 1 }));
    await expect(reindexProducts()).resolves.toEqual({ ok: true, message: 'מוצר אחד נטען למאגר הידע של סוכן השירות' });
    runWebhook.mockImplementation(async () => ({ products: 7 }));
    await expect(reindexProducts()).resolves.toEqual({ ok: true, message: '7 מוצרים נטענו למאגר הידע של סוכן השירות' });
  });
});

describe('setStock', () => {
  // השדה שהחנות קוראת הוא Stock, והדגל הישן InStock חייב לנסוע איתו באותה כתיבה,
  // אחרת מוצר שאזל נשאר "במלאי" בקטלוג.
  it('writes the count and derives InStock from it in one call', async () => {
    await expect(setStock('rec1', '0')).resolves.toEqual({ ok: true });
    expect(erpUpdate).toHaveBeenCalledWith('Products', 'rec1', { Stock: 0, InStock: false });

    await expect(setStock('rec1', '5')).resolves.toEqual({ ok: true });
    expect(erpUpdate).toHaveBeenLastCalledWith('Products', 'rec1', { Stock: 5, InStock: true });
  });

  it('rejects bad input before it reaches n8n', async () => {
    await expect(setStock('rec1', '-1')).resolves.toEqual({ error: 'הכמות לא יכולה להיות שלילית' });
    expect(erpUpdate).not.toHaveBeenCalled();
  });
});

describe('createProduct', () => {
  it('derives InStock from the entered quantity instead of a checkbox', async () => {
    await createProduct({}, fd({ Name: 'מטען 65W', Category: 'מטענים', Price: '129', Description: '', Stock: '3' }));
    expect(erpCreate).toHaveBeenCalledWith('Products', expect.objectContaining({ Stock: 3, InStock: true }));

    await createProduct({}, fd({ Name: 'כבל', Category: 'כבלים', Price: '29', Description: '', Stock: '0' }));
    expect(erpCreate).toHaveBeenLastCalledWith('Products', expect.objectContaining({ Stock: 0, InStock: false }));
  });

  it('gives a service no quantity at all — it is always available', async () => {
    await createProduct({}, fd({ Name: 'תיקון מעבדה', Category: 'שירותים', Price: '149', Description: '', Stock: '7' }));
    const fields = erpCreate.mock.lastCall![1] as Record<string, unknown>;
    expect(fields.InStock).toBe(true);
    expect(fields).not.toHaveProperty('Stock');
  });

  it('reports a bad quantity on the Stock field and writes nothing', async () => {
    const r = await createProduct({}, fd({ Name: 'מטען', Category: 'מטענים', Price: '129', Description: '', Stock: '-4' }));
    expect(r?.errors?.Stock).toBe('הכמות לא יכולה להיות שלילית');
    expect(erpCreate).not.toHaveBeenCalled();
  });
});
