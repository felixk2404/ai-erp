'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MessageCircleIcon, XIcon } from 'lucide-react';
import { useCart } from '@/components/cart/cart-provider';
import { SupportPanel, type Msg } from './support-panel';

/** `window.dispatchEvent(new CustomEvent('aie:support', { detail: { sku } }))` פותח את הבוט עם שאלה מוכנה. */
export type SupportEventDetail = { sku?: string; message?: string };

export const SUPPORT_EVENT = 'aie:support';

/**
 * Intent: נציג שקט שיושב בפינה הקרובה לאגודל ולא מתחרה על תשומת הלב עם המוצר.
 * Hierarchy: עיגול panel-2 עם קו rule יחיד; ה-beam הוא רק האייקון והפעימה — לא מילוי.
 */
export function SupportWidget() {
  // useReducer ולא useState: כלל ה-lint של הפרויקט פוסל קריאה ל-setter של useState
  // מתוך גוף effect (ראו cart-provider.tsx), ו-dispatch עובר.
  const [open, setOpen] = useReducer((_: boolean, next: boolean) => next, false);
  const [prefill, setPrefill] = useState<{ text: string; at: number } | null>(null);
  // התמליל חי כאן ולא בפאנל: הפאנל מתפרק בסגירה, אבל `sessionId` בעוגייה חי
  // שבוע ו-WF13 שומר את ההיסטוריה בצד שלו. תמליל שנמחק בסגירה השאיר את הלקוח
  // מול מסך ריק בזמן שהסוכן ממשיך לענות על שיחה שהוא כבר לא רואה.
  const [messages, setMessages] = useState<Msg[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  // מגירת העגלה במובייל תופסת את כל המסך, והמשגר ישב בדיוק על "מעבר לקופה".
  // כשהעגלה פתוחה היא ההחלטה היחידה — הנציג ממתין בחוץ.
  const { open: cartOpen } = useCart();

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    const onSupport = (e: Event) => {
      const detail = (e as CustomEvent<SupportEventDetail>).detail;
      const text = detail?.message ?? (detail?.sku ? `יש לכם במלאי ${detail.sku}? ומה המחיר?` : '');
      if (text) setPrefill({ text, at: Date.now() });
      setOpen(true);
    };
    window.addEventListener(SUPPORT_EVENT, onSupport);
    return () => window.removeEventListener(SUPPORT_EVENT, onSupport);
  }, []);

  // מגירת העגלה והפאנל חולקים פינה; כשהעגלה נפתחת השיחה נסגרת ולא נשארת מתחתיה.
  useEffect(() => {
    if (cartOpen) close();
  }, [cartOpen, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <>
      {!cartOpen && (
        <motion.button
          ref={buttonRef}
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-label="שירות לקוחות"
          aria-expanded={open}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', bounce: 0.3, visualDuration: 0.25 }}
          className="fixed bottom-5 end-5 z-[var(--z-widget)] grid size-14 place-items-center rounded-full border border-rule bg-panel-2 text-beam transition-colors hover:border-rule-strong hover:bg-panel-3"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,var(--color-beam-soft),transparent_70%)]"
          />
          {/* פעימה אחת כל 8 שניות — "אני כאן", לא לולאת קישוט. אותו אלמנט בשני
              המצבים: useReducedMotion מחזיר null בשרת, ולכן רק הערכים מסתעפים. */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-beam/40"
            initial={{ opacity: 0 }}
            animate={reduce ? { opacity: 0 } : { scale: [1, 1.35], opacity: [0.55, 0] }}
            transition={reduce ? { duration: 0 } : { duration: 1.4, ease: 'easeOut', repeat: Infinity, repeatDelay: 6.6 }}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? 'close' : 'open'}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
              className="relative grid place-items-center"
            >
              {open ? <XIcon size={22} strokeWidth={1.75} aria-hidden /> : <MessageCircleIcon size={22} strokeWidth={1.75} aria-hidden />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      )}

      <AnimatePresence>
        {open && <SupportPanel prefill={prefill} onClose={close} messages={messages} setMessages={setMessages} />}
      </AnimatePresence>
    </>
  );
}
