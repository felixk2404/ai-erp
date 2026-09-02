'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { LoaderCircleIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/components/cart/cart-provider';
import { OrderSummary } from '@/components/checkout/order-summary';
import { placeOrder, type PlaceOrderState } from '@/app/checkout/actions';
import { CHECKOUT_FIELDS } from '@/lib/order';
import { ils } from '@/lib/format';

const EMAIL_KEY = 'aie-order-email';
const SPRING = { type: 'spring' as const, bounce: 0.2, visualDuration: 0.28 };

/** שדה טקסט של הקופה: תווית, שדה, ושגיאה שיושבת מתחת ומחוברת ב-aria. */
function Field({
  label,
  name,
  error,
  hint,
  textarea = false,
  ...props
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  textarea?: boolean;
} & React.ComponentProps<'input'> &
  React.ComponentProps<'textarea'>) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const described = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;
  const shared = {
    id,
    name,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': described,
  };

  // ערך פתיחה תמיד מחרוזת, והוא גם המפתח: כשהשרת מחזיר את מה שהוקלד השדה
  // נטען מחדש עם הערך, במקום "לשנות defaultValue אחרי אתחול" (Base UI מתלונן בצדק).
  const key = String(props.defaultValue ?? '');

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[14px] text-glow-2">
        {label}
      </Label>
      {textarea ? (
        <Textarea key={key} {...shared} {...props} defaultValue={key} className="min-h-20 rounded-sm bg-panel-1 text-[15px]" />
      ) : (
        <Input key={key} {...shared} {...props} defaultValue={key} className={`h-11 rounded-sm bg-panel-1 text-[15px] ${props.className ?? ''}`} />
      )}
      {error && (
        <p id={errorId} className="text-[12px] text-bad">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-[12px] text-glow-4">
          {hint}
        </p>
      )}
    </div>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 font-mono text-[11px] tracking-[0.08em] text-glow-3">{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Intent: מסך החלטה אחרון. כל מה שאינו "אישור הזמנה" מודח בכוונה —
 * השדות על panel-1 בלי מסגרת חיצונית, הסיכום שקט, וה-CTA הוא הדבר היחיד ב-beam,
 * עם הילה רדיאלית מאחוריו כדי שהעין תנחת עליו לפני שהיא קוראת משהו.
 * Hierarchy: CTA (48px, beam) > כותרות פסקאות (מונו 11) > תוויות (14) > רמזים (12).
 * Palette: void/panel-1 + beam ל-CTA ולפוקוס; bad רק לשגיאות; ok ל"חינם".
 * Depth: גבול rule לכל שדה, הילת beam-soft אחת מתחת ל-CTA ואחת בבאנר ההדגמה.
 * Spacing: רשת 8 — 16 בין שדות, 40 בין קבוצות, 40 בין העמודות.
 */
export function CheckoutForm({ onPlaced }: { onPlaced: () => void }) {
  const { cart, totals, clear, setOpen } = useCart();
  const [state, formAction, pending] = useActionState<PlaceOrderState, FormData>(placeOrder, {});
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const lines = cart.lines;
  const physical = lines.some((l) => !l.service);
  const items = JSON.stringify(lines.map(({ sku, qty, service }) => ({ sku, qty, service })));
  const missingNames = (state.outOfStock ?? [])
    .map((sku) => lines.find((l) => l.sku === sku)?.name ?? sku)
    .filter(Boolean);

  // הצלחה: מנקים את העגלה, זוכרים את האימייל למעקב (משימה 10) וממשיכים להזמנה.
  useEffect(() => {
    if (!state.ok || !state.orderNumber) return;
    try {
      sessionStorage.setItem(EMAIL_KEY, state.email ?? '');
    } catch {
      // אחסון לא זמין: עמוד ההזמנה פשוט יבקש את האימייל שוב
    }
    clear();
    router.push(`/orders/${state.orderNumber}`, {
      transitionTypes: ['nav-forward'],
    });
    onPlaced();
  }, [state, clear, router, onPlaced]);

  // שגיאת ולידציה: המיקוד קופץ לשדה הראשון שנפסל, לפי סדר הטופס.
  useEffect(() => {
    if (!state.errors) return;
    const first = CHECKOUT_FIELDS.find((f) => state.errors?.[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <input type="hidden" name="items" value={items} />

      <div className="flex max-w-[560px] flex-col gap-10">
        <div className="relative overflow-hidden rounded-md border border-rule border-s-2 border-s-beam/40 bg-panel-1 p-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 start-0 w-40"
            style={{
              background: 'radial-gradient(closest-side, var(--color-beam-soft), transparent)',
            }}
          />
          <p className="relative text-sm text-glow-2">
            <span className="font-medium text-glow">הדגמה — לא מתבצע חיוב.</span> ההזמנה נשמרת במערכת ותקבלו מייל אישור.
          </p>
        </div>

        <details className="rounded-lg border border-rule bg-panel-1 lg:hidden">
          <summary className="flex h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium text-glow">
            <span>סיכום הזמנה</span>
            <span className="num text-glow-2">{ils(totals.total)}</span>
          </summary>
          <div className="border-t border-rule">
            <OrderSummary lines={lines} totals={totals} outOfStock={state.outOfStock} className="p-4" />
          </div>
        </details>

        <Fieldset title="פרטים">
          <Field
            label="שם מלא"
            name="name"
            autoComplete="name"
            error={state.errors?.name}
            defaultValue={state.values?.name}
          />
          <Field
            label="אימייל"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            hint="לשם יישלח אישור ההזמנה והחשבונית"
            error={state.errors?.email}
            defaultValue={state.values?.email}
          />
          <Field
            label="טלפון"
            name="phone"
            type="tel"
            dir="ltr"
            autoComplete="tel"
            className="num"
            placeholder="050-0000000"
            error={state.errors?.phone}
            defaultValue={state.values?.phone}
          />
        </Fieldset>

        {physical && (
          <Fieldset title="משלוח">
            <Field
              label="כתובת"
              name="address"
              autoComplete="street-address"
              error={state.errors?.address}
              defaultValue={state.values?.address}
            />
            <Field
              label="עיר"
              name="city"
              autoComplete="address-level2"
              error={state.errors?.city}
              defaultValue={state.values?.city}
            />
          </Fieldset>
        )}

        <Field
          label="הערה"
          name="note"
          textarea
          maxLength={500}
          placeholder="משהו שכדאי שנדע — אופציונלי"
          error={state.errors?.note}
          defaultValue={state.values?.note}
        />

        <AnimatePresence>
          {state.error && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              className="rounded-md border border-bad/30 bg-bad/5 p-4"
            >
              <p className="text-sm text-glow">{state.error}</p>
              {missingNames.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {missingNames.map((name) => (
                    <li key={name} className="text-sm text-glow-2">
                      {name} — <span className="text-bad">לא זמין בכמות המבוקשת</span>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-3 text-sm text-beam underline-offset-4 hover:underline"
              >
                חזרה לעגלה
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 -inset-y-6"
            style={{
              background: 'radial-gradient(closest-side, var(--color-beam-soft), transparent)',
            }}
          />
          <button
            type="submit"
            disabled={pending}
            className="relative flex h-12 w-full items-center justify-center gap-2 rounded-md bg-beam text-[15px] font-medium text-void transition-colors hover:bg-beam/85 disabled:bg-beam/60"
          >
            {pending ? (
              <>
                <LoaderCircleIcon size={16} className="animate-spin" aria-hidden />
                <span>שומרים את ההזמנה…</span>
              </>
            ) : (
              <>
                <span>אישור הזמנה</span>
                <span aria-hidden className="text-void/45">
                  —
                </span>
                <span className="num">{ils(totals.total)}</span>
              </>
            )}
          </button>
          <p className="relative mt-3 text-center text-[12px] text-glow-3">
            השליחה יוצרת הזמנה אמיתית במערכת. אין תשלום ואין מסירת פרטי אשראי.
          </p>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 flex flex-col gap-3">
          <h2 className="font-mono text-[11px] tracking-[0.08em] text-glow-3">סיכום הזמנה</h2>
          <OrderSummary lines={lines} totals={totals} outOfStock={state.outOfStock} />
        </div>
      </aside>
    </form>
  );
}
