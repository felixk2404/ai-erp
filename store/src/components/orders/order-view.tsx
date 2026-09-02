'use client';

import { Fragment, useCallback, useEffect, useReducer, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { CheckIcon, CircleXIcon, DownloadIcon, LoaderIcon, MessageCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LookupForm, type LookupValues } from '@/components/orders/lookup-form';
import { lookupOrder } from '@/app/orders/actions';
import { ils } from '@/lib/format';
import { STATUS_LABELS, STATUS_STEPS, stepIndex, withRetryHint } from '@/lib/order-status';
import type { OrderStatus, TrackedOrder } from '@/lib/types';

const EMAIL_KEY = 'aie-order-email';
const POLL_MS = 20_000;
const POLL_MAX = 6;

// הילת השלב הנוכחי בציר: CSS טהור (לא motion) כדי ש-prefers-reduced-motion
// יעצור אותה ברמת הדפדפן, בלי ענף מארקאפ נפרד ל"מצב מופחת תנועה".
const PULSE_CSS = `
@keyframes aie-timeline-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0; transform: scale(1.4); }
}
[data-timeline-pulse] { animation: aie-timeline-pulse 3s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  [data-timeline-pulse] { animation: none; opacity: 0.5; transform: scale(1); }
}
`;

type Phase = { kind: 'loading' } | { kind: 'form' } | { kind: 'error'; message: string } | { kind: 'success'; order: TrackedOrder };

/**
 * Intent: עמוד "האם ההזמנה שלי בדרך" — מוקד תשומת הלב הוא מספר ההזמנה עצמו
 * (הוכחה שהוא קיים ותקין), ואז ציר זמן שעונה על "איפה זה עכשיו" בלי צורך לקרוא טקסט.
 * Hierarchy: מספר הזמנה (focal, .num גדול+הילה) < ציר זמן < פריטים/סכומים < חשבונית < פעולות.
 * Depth: הילת beam-soft יחידה מאחורי המספר; שאר המשטחים panel-1 עם border-rule, בלי צללים.
 * Typography: eyebrow ב-Heebo 500 קטן; מספר ההזמנה ב-.num (JetBrains, tabular) 44–64px; שאר
 * הטקסט לפי הרמפה הרגילה (glow/glow-2/glow-3).
 */
export function OrderView({ orderNumber }: { orderNumber: string }) {
  // useReducer, not useState: this project's react-hooks lint config flags a bare
  // useState setter called from inside an effect body (even transitively, via a
  // useCallback it invokes), but not a reducer dispatch — see cart-provider.tsx.
  const [phase, setPhase] = useReducer((_: Phase, next: Phase) => next, { kind: 'loading' } as Phase);
  const emailRef = useRef('');
  const pollsRef = useRef(0);

  const runLookup = useCallback(
    async (email: string) => {
      emailRef.current = email;
      setPhase({ kind: 'loading' });
      const res = await lookupOrder(orderNumber, email);
      if (res.ok) {
        setPhase({ kind: 'success', order: res.order });
        return;
      }
      setPhase({ kind: 'error', message: withRetryHint(res.error) });
    },
    [orderNumber]
  );

  // עלייה ראשונה: אם כבר יש אימייל שמור (הגעה מ-/track או מהזמנה קודמת), מבצעים בירור מיידי.
  useEffect(() => {
    let email = '';
    try {
      email = sessionStorage.getItem(EMAIL_KEY) ?? '';
    } catch {
      // אחסון לא זמין: נבקש אימייל בטופס
    }
    if (email) void runLookup(email);
    else setPhase({ kind: 'form' });
  }, [runLookup]);

  // פולינג עדין לחשבונית: WF8 מפיק PDF עד כ-2 דקות אחרי ההזמנה (§7.1). נבדוק כל 20s, עד 6 פעמים.
  useEffect(() => {
    if (phase.kind !== 'success') return;
    if (phase.order.invoiceStatus === 'generated') {
      pollsRef.current = 0;
      return;
    }
    if (pollsRef.current >= POLL_MAX) return;
    const timer = setTimeout(() => {
      pollsRef.current += 1;
      void lookupOrder(orderNumber, emailRef.current).then((res) => {
        if (res.ok) setPhase({ kind: 'success', order: res.order });
      });
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [phase, orderNumber]);

  const handleSubmit = useCallback(
    ({ email }: LookupValues) => {
      try {
        sessionStorage.setItem(EMAIL_KEY, email);
      } catch {
        // אחסון לא זמין: הבדיקה החד-פעמית עדיין תעבוד
      }
      void runLookup(email);
    },
    [runLookup]
  );

  return (
    <div aria-live="polite" aria-busy={phase.kind === 'loading'} className="mx-auto flex max-w-2xl flex-col gap-8 py-4">
      {phase.kind === 'loading' && <OrderSkeleton />}

      {(phase.kind === 'form' || phase.kind === 'error') && (
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6 py-12 text-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-extrabold text-glow">מעקב הזמנה</h1>
            <span dir="ltr" className="num text-sm text-glow-3">
              {orderNumber}
            </span>
          </div>
          {phase.kind === 'error' && (
            <p role="alert" className="text-sm text-bad">
              {phase.message}
            </p>
          )}
          <LookupForm orderNumber={orderNumber} onSubmit={handleSubmit} />
        </div>
      )}

      {phase.kind === 'success' && <SuccessView order={phase.order} />}
    </div>
  );
}

function SuccessView({ order }: { order: TrackedOrder }) {
  return (
    <>
      <OrderNumberDisplay value={order.orderNumber} />
      <OrderTimeline status={order.status} />
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-glow-3">פריטים</h2>
        <ItemsTable items={order.items} />
      </section>
      <Totals order={order} />
      <InvoiceBlock order={order} />
      <div className="flex flex-wrap gap-3 border-t border-rule pt-6">
        <Button nativeButton={false} render={<Link href="/products" transitionTypes={['nav-forward']} />}>
          המשך קנייה
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            window.dispatchEvent(new CustomEvent('aie:support', { detail: { message: `שאלה על הזמנה ${order.orderNumber}` } }))
          }
        >
          <MessageCircleIcon size={16} aria-hidden />
          שאלה על ההזמנה
        </Button>
      </div>
    </>
  );
}

/** המוקד החזותי היחיד בעמוד: הילת beam מאחורי מספר ההזמנה, ספרות נחשפות בסטאגר קצר. */
function OrderNumberDisplay({ value }: { value: string }) {
  return (
    <div className="relative flex flex-col items-center gap-1 py-6">
      <span
        aria-hidden
        className="absolute inset-0 mx-auto h-32 w-64 -translate-y-2 bg-[radial-gradient(closest-side,var(--color-beam-soft),transparent)]"
      />
      <span className="relative text-xs font-medium tracking-wide text-glow-3">ההזמנה התקבלה</span>
      <span dir="ltr" className="num relative flex text-[44px] leading-none font-extrabold text-glow sm:text-[64px]">
        {[...value].map((ch, i) => (
          <motion.span
            key={`${ch}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0.25, visualDuration: 0.3, delay: i * 0.04 }}
          >
            {ch}
          </motion.span>
        ))}
      </span>
    </div>
  );
}

/**
 * Intent: לענות "איפה ההזמנה עכשיו" בלי טקסט — ארבע נקודות וקו שמצייר את עצמו.
 * `cancelled` יוצא מהציר הליניארי (לא "שלב חמישי") ומוצג כתג בודד באדום.
 */
function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div role="status" className="flex items-center gap-2 rounded-lg border border-rule bg-panel-1 px-4 py-3 text-bad">
        <CircleXIcon size={18} aria-hidden />
        <span className="text-sm font-medium">ההזמנה בוטלה</span>
      </div>
    );
  }

  const current = stepIndex(status);
  // עמודות auto לנקודות/תוויות, עמודות 1fr לקווים המחברים ביניהן — כך ששורת
  // התוויות מיושרת בדיוק מתחת לנקודות, בלי תלות ברוחב הקווים (grid, לא flex).
  const DOT_COL = ['col-start-1', 'col-start-3', 'col-start-5', 'col-start-7'] as const;
  const LINE_COL = ['col-start-2', 'col-start-4', 'col-start-6'] as const;

  return (
    <>
      <style>{PULSE_CSS}</style>
      <div
        role="group"
        aria-label="סטטוס ההזמנה"
        className="grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] items-center gap-y-2"
      >
        {STATUS_STEPS.map((step, i) => (
          <Fragment key={step}>
            <span
              className={
                `row-start-1 ${DOT_COL[i]} relative grid size-8 shrink-0 justify-self-center place-items-center rounded-full border text-xs font-medium ` +
                (i < current
                  ? 'border-beam bg-beam text-void'
                  : i === current
                    ? 'border-beam bg-panel-1 text-beam'
                    : 'border-rule bg-panel-1 text-glow-4')
              }
            >
              {i < current ? <CheckIcon size={14} aria-hidden /> : i + 1}
              {/* פעימה סמנטית (מתקשרת "כאן עכשיו"), לא קישוט — ראו system.md #9.
                  CSS טהור, לא motion: כך `prefers-reduced-motion` עוצר אותה נטיבית
                  בלי ענף מארקאפ נפרד. */}
              {i === current && <span aria-hidden data-timeline-pulse className="absolute inset-0 rounded-full bg-beam-soft" />}
            </span>
            {i < LINE_COL.length && (
              <div className={`row-start-1 ${LINE_COL[i]} relative mx-1 h-px bg-rule`}>
                <motion.div
                  aria-hidden
                  className="absolute inset-0 origin-right bg-beam"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i < current ? 1 : 0 }}
                  transition={{ type: 'spring', bounce: 0.15, visualDuration: 0.4, delay: i * 0.08 }}
                />
              </div>
            )}
            <span className={`row-start-2 ${DOT_COL[i]} text-center text-xs font-medium ${i <= current ? 'text-glow-2' : 'text-glow-4'}`}>
              {STATUS_LABELS[step]}
            </span>
          </Fragment>
        ))}
      </div>
    </>
  );
}

function ItemsTable({ items }: { items: TrackedOrder['items'] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-rule">
      {/* < sm: כרטיס דו-שורתי לכל פריט — טבלה עם 4 עמודות נחתכת ב-390px. */}
      <ul className="flex flex-col divide-y divide-rule sm:hidden">
        {items.map((item) => (
          <li key={item.sku} className="flex flex-col gap-1 px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-glow">{item.name}</span>
              <span dir="ltr" className="num shrink-0 text-xs text-glow-3">
                {item.sku}
              </span>
            </div>
            <div className="num text-xs text-glow-2">
              {item.qty} × {ils(item.price)} = <span className="text-glow">{ils(item.qty * item.price)}</span>
            </div>
          </li>
        ))}
      </ul>

      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b border-rule bg-panel-1 text-glow-3">
            <th className="px-4 py-2 text-start font-medium">פריט</th>
            <th className="px-4 py-2 text-start font-medium">מק&quot;ט</th>
            <th className="px-4 py-2 text-start font-medium">כמות</th>
            <th className="px-4 py-2 text-start font-medium">סה&quot;כ</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.sku} className="border-b border-rule last:border-0">
              <td className="px-4 py-3 text-glow">{item.name}</td>
              <td className="px-4 py-3">
                <span dir="ltr" className="num text-glow-3">
                  {item.sku}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="num text-glow-2">{item.qty}</span>
              </td>
              <td className="px-4 py-3">
                <span className="num text-glow">{ils(item.qty * item.price)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Totals({ order }: { order: TrackedOrder }) {
  return (
    <dl className="flex flex-col gap-1.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-glow-3">ביניים</dt>
        <dd className="num text-glow-2">{ils(order.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-glow-3">משלוח</dt>
        <dd className={order.shipping === 0 ? 'text-glow-2' : 'num text-glow-2'}>
          {order.shipping === 0 ? 'חינם' : ils(order.shipping)}
        </dd>
      </div>
      <div className="flex justify-between border-t border-rule pt-1.5 text-base font-medium">
        <dt className="text-glow">סה&quot;כ</dt>
        <dd className="num text-glow">{ils(order.total)}</dd>
      </div>
    </dl>
  );
}

function InvoiceBlock({ order }: { order: TrackedOrder }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-rule bg-panel-1 px-4 py-3">
      {order.pdfUrl ? (
        <a
          href={order.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-beam hover:underline"
        >
          <DownloadIcon size={16} aria-hidden />
          הורדת חשבונית PDF
        </a>
      ) : (
        <span className="inline-flex items-center gap-2 text-sm text-glow-3">
          <LoaderIcon size={16} aria-hidden className="animate-spin" />
          החשבונית מופקת…
        </span>
      )}
      {order.invoiceNumber && (
        <span dir="ltr" className="num text-xs text-glow-4">
          {order.invoiceNumber}
        </span>
      )}
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden>
      <div className="flex flex-col items-center gap-3 py-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-56 sm:h-16" />
      </div>
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <span className="sr-only">טוען את פרטי ההזמנה…</span>
    </div>
  );
}
