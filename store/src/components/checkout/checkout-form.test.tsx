// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { CartProvider } from '@/components/cart/cart-provider';
import { CheckoutForm } from './checkout-form';
import type { PlaceOrderState } from '@/app/checkout/actions';

const placeOrder = vi.fn<() => Promise<PlaceOrderState>>();

vi.mock('@/app/checkout/actions', () => ({ placeOrder: () => placeOrder() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  cleanup();
  placeOrder.mockReset();
  localStorage.clear();
});

const form = () => (
  <CartProvider>
    <CheckoutForm onPlaced={() => {}} />
  </CartProvider>
);
const submit = () => screen.getByRole('button', { name: /אישור הזמנה/ });

/**
 * הסכנה היקרה ביותר בחנות: הזמנה כפולה = שתי רשומות ב-Airtable, שתי חשבוניות
 * ושני מיילים. `aria-disabled` הוא סימון בלבד, ו-`pending` נקרא מהסגור של הרינדור —
 * שתי הפעלות באותו פריים *מצטברות לתור* של `useActionState`, והשנייה רצה
 * ברגע שהראשונה נגמרת. רק תפס שנסגר סינכרונית עוצר אותה.
 */
describe('CheckoutForm — הזמנה אחת ללחיצה', () => {
  it('שתי הפעלות באותו פריים שולחות הזמנה אחת בלבד', async () => {
    let settle: (s: PlaceOrderState) => void = () => {};
    placeOrder.mockImplementationOnce(() => new Promise<PlaceOrderState>((r) => (settle = r)));
    placeOrder.mockResolvedValue({ error: 'ההזמנה השנייה' });

    render(form());
    const btn = submit();
    act(() => {
      btn.click();
      btn.click();
    });
    expect(placeOrder).toHaveBeenCalledTimes(1);

    // הרגע שבו הבאג צף: התור של useActionState משחרר את ההפעלה השנייה.
    await act(async () => settle({ error: 'לא הצלחנו לשמור את ההזמנה, נסו שוב בעוד רגע' }));
    expect(placeOrder).toHaveBeenCalledTimes(1);
  });

  it('שליחה חוזרת מכוונת אחרי שהראשונה נגמרה עדיין עוברת', async () => {
    placeOrder.mockResolvedValue({ error: 'לא הצלחנו לשמור את ההזמנה, נסו שוב בעוד רגע' });
    render(form());

    await act(async () => submit().click());
    await act(async () => submit().click());
    expect(placeOrder).toHaveBeenCalledTimes(2);
  });
});
