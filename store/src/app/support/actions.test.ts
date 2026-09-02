import { beforeEach, describe, expect, it, vi } from 'vitest';

/** תשובת הסוכן נושאת כרטיסי מוצר — ובכרטיס אין מספרים, רק "יש / אין". */
const mocks = vi.hoisted(() => ({ erpCall: vi.fn(), getProducts: vi.fn(), ip: 'ip-0', cookie: undefined as string | undefined }));

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': mocks.ip }),
  cookies: async () => ({ get: () => (mocks.cookie ? { value: mocks.cookie } : undefined), set: (_k: string, v: string) => (mocks.cookie = v) }),
}));
vi.mock('@/lib/n8n', () => ({ erpCall: (...args: unknown[]) => mocks.erpCall(...args), ErpError: class extends Error {} }));
vi.mock('@/lib/catalog', () => ({
  getProducts: () => mocks.getProducts(),
  isService: (p: { fields: { Category?: string } }) => p.fields.Category === 'שירותים',
  inStock: (p: { fields: { Category?: string; Stock?: number } }) => p.fields.Category === 'שירותים' || (p.fields.Stock ?? 0) > 0,
}));

import { sendSupport } from './actions';

const rec = (Sku: string, Name: string, Category: string, Stock: number) => ({
  id: Sku,
  createdTime: '',
  fields: { Name, Sku, Category, Price: 349, Stock, Description: 'תיאור פנימי', Highlights: 'ANC' },
});
const CATALOG = [rec('TY-HP-200', 'אוזניות אלחוטיות TY-200', 'אוזניות', 42), rec('TY-MN-34U', 'מסך אולטרה-רחב', 'מסכים', 0)];

let seq = 0;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.ip = `ip-${(seq += 1)}`;
  mocks.cookie = 'session-1';
  mocks.getProducts.mockResolvedValue(CATALOG);
});

describe('sendSupport', () => {
  it('כרטיס המוצר לא נושא כמות מלאי ולא תיאור', async () => {
    mocks.erpCall.mockResolvedValue({ ok: true, reply: 'יש לנו TY-HP-200 במלאי, וגם TY-MN-34U.' });

    const res = await sendSupport('מה יש לכם?');

    expect(res.products).toEqual([
      { sku: 'TY-HP-200', name: 'אוזניות אלחוטיות TY-200', price: 349, imageUrl: undefined, inStock: true, service: false },
      { sku: 'TY-MN-34U', name: 'מסך אולטרה-רחב', price: 349, imageUrl: undefined, inStock: false, service: false },
    ]);
    const wire = JSON.stringify(res);
    expect(wire).not.toMatch(/"Stock"/);
    expect(wire).not.toMatch(/42/);
    expect(wire).not.toMatch(/תיאור פנימי/);
  });

  it('ההודעה נחתכת ל-500 תווים וההקשר נוסע בתוכה', async () => {
    mocks.erpCall.mockResolvedValue({ ok: true, reply: 'בסדר' });

    await sendSupport('x'.repeat(600), { sku: 'TY-HP-200', page: '/products/TY-HP-200' });

    const body = mocks.erpCall.mock.calls[0][0] as { message: string; sessionId: string };
    expect(body.message.startsWith('x'.repeat(500))).toBe(true);
    expect(body.message).toContain('מק"ט TY-HP-200');
    expect(body.sessionId).toBe('session-1');
  });

  it('הודעה ריקה לא מגיעה ל-ERP', async () => {
    expect(await sendSupport('   ')).toEqual({ error: 'כתבו שאלה' });
    expect(mocks.erpCall).not.toHaveBeenCalled();
  });

  it('כשל בקטלוג לא בולע תשובה תקינה', async () => {
    mocks.getProducts.mockRejectedValue(new Error('airtable down'));
    mocks.erpCall.mockResolvedValue({ ok: true, reply: 'משלוח חינם מעל 300 ₪.' });

    const res = await sendSupport('משלוח?');

    expect(res.reply).toBe('משלוח חינם מעל 300 ₪.');
    expect(res.products).toEqual([]);
  });

  it('תקלה ב-ERP מחזירה ערוץ חלופי, לא stack trace', async () => {
    mocks.erpCall.mockRejectedValue(new Error('boom'));

    const res = await sendSupport('שלום');

    expect(res.error).toMatch('טלגרם');
    expect(res.reply).toBeUndefined();
  });
});
