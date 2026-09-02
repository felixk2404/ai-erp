import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `/orders/<n>` הוא עמוד ציבורי בלי אימות: הקלט חייב להיות חסום, וכל דחייה
 * חייבת להישמע זהה — אחרת הטופס הופך לאורקל שמלמד איזה מספר הזמנה קיים.
 */
const mocks = vi.hoisted(() => ({ erpCall: vi.fn(), ip: 'ip-0' }));

vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-forwarded-for': mocks.ip }) }));
vi.mock('@/lib/n8n', () => ({ erpCall: (...args: unknown[]) => mocks.erpCall(...args), ErpError: class extends Error {} }));

import { lookupOrder } from './actions';

const NOT_FOUND = 'ההזמנה לא נמצאה';

let seq = 0;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.ip = `ip-${(seq += 1)}`;
});

describe('lookupOrder', () => {
  it('מנרמל מספר הזמנה ואימייל לפני השליחה', async () => {
    mocks.erpCall.mockResolvedValue({ ok: true, order: { orderNumber: 'ORD-0001' } });

    const res = await lookupOrder('  ord-0001 ', ' Buyer@Example.COM ');

    expect(res.ok).toBe(true);
    expect(mocks.erpCall.mock.calls[0][0]).toMatchObject({
      action: 'order_status',
      orderNumber: 'ORD-0001',
      email: 'buyer@example.com',
    });
  });

  it.each([
    ['מספר הזמנה ארוך מדי', 'ORD-' + '9'.repeat(40), 'buyer@example.com'],
    ['מספר הזמנה ריק אחרי נרמול', '!!!', 'buyer@example.com'],
    ['אימייל לא תקין', 'ORD-0001', 'not-an-email'],
    ['אימייל ארוך מדי', 'ORD-0001', `${'a'.repeat(250)}@example.com`],
  ])('%s — אותה תשובה בדיוק, ובלי לפנות ל-ERP', async (_label, orderNumber, email) => {
    const res = await lookupOrder(orderNumber, email);

    expect(res).toEqual({ ok: false, error: NOT_FOUND });
    expect(mocks.erpCall).not.toHaveBeenCalled();
  });

  it('קלט פסול לא שורף את מכסת הקצב', async () => {
    mocks.ip = 'ip-typos';
    for (let i = 0; i < 25; i += 1) expect(await lookupOrder('ORD-0001', 'oops')).toEqual({ ok: false, error: NOT_FOUND });

    mocks.erpCall.mockResolvedValue({ ok: true, order: { orderNumber: 'ORD-0001' } });
    expect((await lookupOrder('ORD-0001', 'buyer@example.com')).ok).toBe(true);
  });

  it('תקלה ברשת מוצגת כשירות לא זמין, לא כ"לא נמצאה"', async () => {
    mocks.erpCall.mockRejectedValue(new Error('boom'));

    const res = await lookupOrder('ORD-0001', 'buyer@example.com');

    expect(res).toEqual({ ok: false, error: 'השירות לא זמין כרגע, נסו שוב בעוד רגע' });
  });
});
