// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { CartProvider } from '@/components/cart/cart-provider';
import { SupportWidget } from './support-widget';
import type { SupportResult } from '@/app/support/actions';

const sendSupport = vi.fn<() => Promise<SupportResult>>();
vi.mock('@/app/support/actions', () => ({ sendSupport: () => sendSupport() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/products' }));

// jsdom לא ממש את scrollIntoView; הפאנל גולל לתחתית בכל הודעה.
Element.prototype.scrollIntoView = () => {};

afterEach(() => {
  cleanup();
  sendSupport.mockReset();
  localStorage.clear();
});

const launcher = () => screen.getByRole('button', { name: 'שירות לקוחות' });
// תשובת הסוכן נחשפת משפט-משפט, ולכן היא פרושה על כמה spans.
const transcript = () => document.body.textContent ?? '';

/**
 * ה-`sessionId` בעוגייה חי שבוע ו-WF13 שומר את ההיסטוריה בצד שלו. אם התמליל
 * נמחק בסגירת הפאנל, הלקוח פותח מחדש למסך ריק בזמן שהסוכן ממשיך לענות על
 * שיחה שהוא כבר לא רואה — מצב גרוע משתי האפשרויות ההגיוניות.
 */
describe('SupportWidget', () => {
  it('keeps the transcript when the panel is closed and reopened', async () => {
    sendSupport.mockResolvedValue({ reply: 'כן, יש במלאי.', products: [] });
    render(
      <CartProvider>
        <SupportWidget />
      </CartProvider>
    );

    await act(async () => launcher().click());
    // הפאנל נטען ב-next/dynamic — צריך להמתין לו בפעם הראשונה.
    const suggestion = await screen.findByText('יש במלאי TY-MN-27Q?');
    await act(async () => suggestion.click());
    expect(transcript()).toContain('כן, יש במלאי.');

    await act(async () => screen.getByRole('button', { name: 'סגירת השיחה' }).click());
    // ממתינים ליציאה של AnimatePresence — רק אז הפאנל באמת מתפרק.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(screen.queryByRole('dialog')).toBeNull();

    await act(async () => launcher().click());
    await screen.findByRole('dialog');
    expect(transcript()).toContain('כן, יש במלאי.');
  });
});
