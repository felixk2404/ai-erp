import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `placeOrder` הוא הגבול בין הדפדפן ל-ERP. הבדיקות כאן שומרות על ארבע החלטות
 * שקל לשבור בלי לשים לב: מה *לא* חוזר ללקוח (כמויות מלאי), מתי אסור להציע
 * שליחה חוזרת, שהדגל `service` נגזר מהקטלוג ולא מהדפדפן, ושוולידציה לא שורפת
 * את מכסת הקצב של לקוח שהקליד שם ריק.
 */
const mocks = vi.hoisted(() => ({ erpCall: vi.fn(), getProducts: vi.fn(), ip: 'ip-0' }));

vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-forwarded-for': mocks.ip }) }));
vi.mock('@/lib/n8n', () => ({
  erpCall: (...args: unknown[]) => mocks.erpCall(...args),
  ErpError: class ErpError extends Error {},
  ErpShapeError: class ErpShapeError extends Error {},
}));
vi.mock('@/lib/catalog', () => ({
  getProducts: () => mocks.getProducts(),
  isService: (p: { fields: { Category?: string } }) => p.fields.Category === 'שירותים',
}));

import { ErpError } from '@/lib/n8n';
import { placeOrder } from './actions';

const rec = (Sku: string, Category: string) => ({ id: Sku, createdTime: '', fields: { Name: Sku, Sku, Category, Price: 100, Stock: 4 } });
const CATALOG = [rec('TY-HP-200', 'אוזניות'), rec('TY-MN-27Q', 'מסכים'), rec('TY-SRV-01', 'שירותים')];

const BASE = {
  name: 'ישראל ישראלי',
  email: 'buyer@example.com',
  phone: '050-1234567',
  address: 'הרצל 1',
  city: 'תל אביב',
  note: '',
  items: JSON.stringify([{ sku: 'TY-HP-200', qty: 2, service: false }]),
};

const form = (over: Partial<typeof BASE> = {}) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...BASE, ...over })) fd.set(k, v);
  return fd;
};

let seq = 0;
beforeEach(() => {
  vi.clearAllMocks();
  // IP חדש לכל בדיקה: מונה הקצב חי ברמת המודול ומשותף לקובץ.
  mocks.ip = `ip-${(seq += 1)}`;
  mocks.getProducts.mockResolvedValue(CATALOG);
});

describe('placeOrder — מה חוזר ללקוח', () => {
  it('פריט שאזל מוחזר כמק"ט בלבד, בלי הכמות הזמינה', async () => {
    mocks.erpCall.mockResolvedValue({
      ok: false,
      error: 'חלק מהפריטים אזלו',
      outOfStock: [{ sku: 'TY-HP-200', name: 'אוזניות', available: 1 }],
    });

    const res = await placeOrder({}, form());

    expect(res.outOfStock).toEqual(['TY-HP-200']);
    expect(JSON.stringify(res)).not.toMatch(/available/);
    expect(res.maybeSaved).toBeUndefined();
  });

  it('מחירים לא נוסעים מהדפדפן — רק מק"ט וכמות', async () => {
    mocks.erpCall.mockResolvedValue({ ok: true, orderNumber: 'ORD-0009' });

    const res = await placeOrder({}, form());

    expect(res).toMatchObject({ ok: true, orderNumber: 'ORD-0009', email: 'buyer@example.com' });
    const [, body] = mocks.erpCall.mock.calls[0] as [unknown, { order: { items: unknown[] } }];
    expect(body.order.items).toEqual([{ sku: 'TY-HP-200', qty: 2 }]);
    expect(JSON.stringify(body)).not.toMatch(/price/i);
  });
});

describe('placeOrder — "ייתכן שההזמנה נשמרה"', () => {
  it('timeout מסמן maybeSaved', async () => {
    const timeout = new Error('timed out');
    timeout.name = 'TimeoutError';
    mocks.erpCall.mockRejectedValue(timeout);

    const res = await placeOrder({}, form());

    expect(res.maybeSaved).toBe(true);
    expect(res.error).toMatch('ייתכן שההזמנה נשמרה');
    expect(res.values?.name).toBe(BASE.name);
  });

  it('5xx מ-n8n מסמן maybeSaved, 4xx לא', async () => {
    mocks.erpCall.mockRejectedValueOnce(new ErpError('n8n 503'));
    expect((await placeOrder({}, form())).maybeSaved).toBe(true);

    mocks.ip = 'ip-4xx';
    mocks.erpCall.mockRejectedValueOnce(new ErpError('n8n 400'));
    const res = await placeOrder({}, form());
    expect(res.maybeSaved).toBeUndefined();
    expect(res.error).toMatch('נסו שוב');
  });

  it('גוף ok:false מתועד עם אותו נוסח מסמן maybeSaved ולא outOfStock', async () => {
    mocks.erpCall.mockResolvedValue({
      ok: false,
      error: 'שגיאה זמנית בשמירת ההזמנה. ייתכן שההזמנה נשמרה — בדקו בעמוד מעקב ההזמנה לפי האימייל.',
    });

    const res = await placeOrder({}, form());

    expect(res.maybeSaved).toBe(true);
    expect(res.outOfStock).toBeUndefined();
  });
});

describe('placeOrder — הדגל service נגזר מהקטלוג', () => {
  it('דפדפן שמסמן מוצר פיזי כשירות עדיין נדרש לכתובת', async () => {
    const res = await placeOrder(
      {},
      form({ address: '', city: '', items: JSON.stringify([{ sku: 'TY-MN-27Q', qty: 1, service: true }]) }),
    );

    expect(res.errors).toEqual({ address: 'נדרש למשלוח', city: 'נדרש למשלוח' });
    expect(mocks.erpCall).not.toHaveBeenCalled();
  });

  it('שירות אמיתי לפי הקטלוג עובר בלי כתובת', async () => {
    mocks.erpCall.mockResolvedValue({ ok: true, orderNumber: 'ORD-0010' });

    const res = await placeOrder(
      {},
      form({ address: '', city: '', items: JSON.stringify([{ sku: 'TY-SRV-01', qty: 1, service: true }]) }),
    );

    expect(res.ok).toBe(true);
  });

  it('כשל בקטלוג נופל לדגל של הדפדפן ולא חוסם הזמנה', async () => {
    mocks.getProducts.mockRejectedValue(new Error('airtable down'));
    mocks.erpCall.mockResolvedValue({ ok: true, orderNumber: 'ORD-0011' });

    const res = await placeOrder(
      {},
      form({ address: '', city: '', items: JSON.stringify([{ sku: 'TY-SRV-01', qty: 1, service: true }]) }),
    );

    expect(res.ok).toBe(true);
  });
});

describe('placeOrder — מונה הקצב', () => {
  it('נצרך רק אחרי שהטופס עבר ולידציה', async () => {
    mocks.ip = 'ip-limiter';
    // שש שליחות פסולות — יותר מהמכסה (5). אף אחת מהן לא מגיעה ל-n8n.
    for (let i = 0; i < 6; i += 1) {
      const res = await placeOrder({}, form({ name: '' }));
      expect(res.errors?.name).toBe('צריך שם מלא');
    }
    expect(mocks.erpCall).not.toHaveBeenCalled();

    mocks.erpCall.mockResolvedValue({ ok: true, orderNumber: 'ORD-0012' });
    const res = await placeOrder({}, form());
    expect(res.ok).toBe(true);
  });

  it('חוסם אחרי חמש הזמנות תקינות מאותו IP', async () => {
    mocks.ip = 'ip-flood';
    mocks.erpCall.mockResolvedValue({ ok: true, orderNumber: 'ORD-0013' });
    for (let i = 0; i < 5; i += 1) expect((await placeOrder({}, form())).ok).toBe(true);

    const res = await placeOrder({}, form());
    expect(res.error).toMatch('יותר מדי ניסיונות');
    expect(mocks.erpCall).toHaveBeenCalledTimes(5);
  });
});
