// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { OrderView } from './order-view';
import type { LookupResult } from '@/app/orders/actions';
import type { TrackedOrder } from '@/lib/types';
import { ORDER_EMAIL_KEY } from '@/lib/ui';

const lookupOrder = vi.fn<() => Promise<LookupResult>>();
vi.mock('@/app/orders/actions', () => ({ lookupOrder: () => lookupOrder() }));

const order = (over: Partial<TrackedOrder> = {}): TrackedOrder => ({
  orderNumber: 'ORD-0001',
  status: 'confirmed',
  items: [{ sku: 'TY-HP-200', name: 'אוזניות', qty: 1, price: 100 }],
  subtotal: 100,
  shipping: 0,
  total: 100,
  created: '2026-09-01',
  invoiceNumber: null,
  pdfUrl: null,
  invoiceStatus: null,
  ...over,
});

const POLL_MS = 20_000;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  sessionStorage.setItem(ORDER_EMAIL_KEY, 'felix@example.com');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  lookupOrder.mockReset();
  sessionStorage.clear();
});

const mount = async () => {
  render(<OrderView orderNumber="ORD-0001" />);
  await act(async () => {});
};

const tick = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('OrderView — החשבונית', () => {
  /**
   * הפולינג נעצר על `invoiceStatus === 'generated'` בעוד שהמסך מכריז "מוכן"
   * על `pdfUrl`. סטטוס שהתהפך לפני שה-URL נכתב השאיר ספינר נצחי בלי שום פעולה.
   */
  it('סטטוס generated בלי pdfUrl מציג פעולה, לא ספינר נצחי', async () => {
    lookupOrder.mockResolvedValue({ ok: true, order: order({ invoiceStatus: 'generated' }) });
    await mount();

    expect(screen.queryByText('החשבונית מופקת…')).toBeNull();
    expect(screen.getByRole('button', { name: /בדקו שוב/ })).toBeTruthy();
  });

  it('pdfUrl קיים עוצר את הפולינג ומכריז שהחשבונית מוכנה', async () => {
    lookupOrder.mockResolvedValue({ ok: true, order: order({ pdfUrl: 'https://x/inv.pdf', invoiceStatus: null }) });
    await mount();
    expect(screen.getByRole('link', { name: /הורדת חשבונית PDF/ })).toBeTruthy();
    expect(screen.getByText('החשבונית מוכנה להורדה')).toBeTruthy();

    const calls = lookupOrder.mock.calls.length;
    await tick(POLL_MS * 3);
    expect(lookupOrder).toHaveBeenCalledTimes(calls);
  });

  /**
   * המונה עולה *לפני* ה-await, ולכן בקשה איטית מ-20s מייצרת חפיפה: תשובה ישנה
   * שנוחתת אחרי חדשה החזירה את המסך למצב שכבר לא נכון.
   */
  it('תשובה ישנה שנוחתת אחרי חדשה לא דורסת את המצב', async () => {
    let settleStale: (r: LookupResult) => void = () => {};
    lookupOrder
      .mockResolvedValueOnce({ ok: true, order: order() })
      .mockImplementationOnce(() => new Promise<LookupResult>((r) => (settleStale = r)))
      .mockResolvedValue({ ok: true, order: order({ pdfUrl: 'https://x/inv.pdf', invoiceStatus: 'generated' }) });

    await mount();
    await tick(POLL_MS); // הפולינג האיטי יוצא לדרך
    await tick(POLL_MS); // הפולינג הבא עוקף אותו ומחזיר חשבונית מוכנה
    expect(screen.getByRole('link', { name: /הורדת חשבונית PDF/ })).toBeTruthy();

    await act(async () => settleStale({ ok: true, order: order() }));
    expect(screen.getByRole('link', { name: /הורדת חשבונית PDF/ })).toBeTruthy();
  });
});
