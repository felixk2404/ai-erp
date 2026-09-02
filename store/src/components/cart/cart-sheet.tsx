'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBagIcon, XIcon } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { CountUp } from '@/components/motion/count-up';
import { CartLine } from '@/components/cart/cart-line';
import { FreeShippingBar } from '@/components/cart/free-shipping-bar';
import { useCart } from '@/components/cart/cart-provider';
import { ils } from '@/lib/format';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-glow-2">{label}</span>
      <span className="text-glow">{children}</span>
    </div>
  );
}

/**
 * מגירת העגלה. נקודת הכובד היחידה היא כפתור "לקופה" — הוא היחיד ב-beam,
 * וכל השאר יורד בסולם glow. השורות נושמות (16px ריפוד, קו rule ביניהן),
 * הכיסים בתחתית צפופים: זה אזור החלטה, לא אזור קריאה.
 * המגירה נכנסת מהקצה הסופי (שמאל ב-RTL) כדי לא לכסות את כפתור העגלה בכותרת.
 */
export function CartSheet() {
  const { cart, totals, open, setOpen, setQty, remove } = useCart();
  const lines = cart.lines;
  const empty = lines.length === 0;
  const physical = lines.some((l) => !l.service);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        showCloseButton={false}
        aria-label="העגלה שלך"
        className="flex flex-col gap-0 border-rule bg-panel-1 p-0 data-[side=left]:w-full data-[side=left]:sm:max-w-[420px]"
      >
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-rule px-4">
          <div className="flex items-baseline gap-2">
            <SheetTitle className="text-[18px] font-medium text-glow">העגלה שלך</SheetTitle>
            {/* אזור חי קבוע (לא מותנה) כדי שקוראי מסך יקבלו עדכון; ריק כשהעגלה ריקה — "0" לצד הכותרת הוא רעש. */}
            <span aria-live="polite" className="num text-sm text-glow-3">
              {totals.count > 0 ? totals.count : ''}
            </span>
          </div>
          <SheetClose
            render={
              <button
                type="button"
                aria-label="סגירת העגלה"
                className="-me-2.5 grid size-11 shrink-0 place-items-center rounded-sm text-glow-3 transition-colors hover:bg-panel-2 hover:text-glow"
              />
            }
          >
            <XIcon size={18} strokeWidth={1.75} aria-hidden />
          </SheetClose>
        </header>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 pb-16 text-center">
            <div className="relative grid size-24 place-items-center">
              <div
                aria-hidden
                className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,var(--color-beam-soft),transparent)]"
              />
              <ShoppingBagIcon size={34} strokeWidth={1.25} className="relative text-glow-4" aria-hidden />
            </div>
            <div className="space-y-1.5">
              <p className="text-[18px] font-medium text-glow">העגלה ריקה</p>
              <p className="text-sm text-glow-3">כל מה שתוסיפו יופיע כאן.</p>
            </div>
            <Link
              href="/products"
              transitionTypes={['nav-forward']}
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center rounded-md border border-rule-strong px-5 text-sm font-medium text-glow transition-colors hover:bg-panel-2"
            >
              לקטלוג
            </Link>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
              <AnimatePresence initial={false} mode="popLayout">
                {lines.map((line) => (
                  <CartLine
                    key={line.sku}
                    line={line}
                    onQty={(qty) => setQty(line.sku, qty)}
                    onRemove={() => remove(line.sku)}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </AnimatePresence>
            </div>

            <div className="shrink-0 space-y-4 border-t border-rule bg-panel-1 p-4">
              {physical && <FreeShippingBar gap={totals.freeShippingGap} subtotal={totals.subtotal} />}

              <div className="space-y-2">
                <Row label="ביניים">
                  <span className="num">{ils(totals.subtotal)}</span>
                </Row>
                <Row label="משלוח">
                  {totals.shipping > 0 ? <span className="num">{ils(totals.shipping)}</span> : <span className="text-ok">חינם</span>}
                </Row>
                <motion.div layout className="flex items-baseline justify-between gap-4 border-t border-rule pt-3">
                  <span className="text-sm font-medium text-glow">סה״כ</span>
                  <CountUp value={totals.total} money className="text-[22px] leading-none font-medium text-glow" />
                </motion.div>
                <p className="text-end text-[11px] text-glow-2">
                  כולל מע״מ <span className="num">{ils(totals.vat)}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  transitionTypes={['nav-forward']}
                  onClick={() => setOpen(false)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-beam text-base font-medium text-void transition-colors hover:bg-beam/85"
                >
                  <span>לקופה</span>
                  <span aria-hidden className="text-void/45">
                    —
                  </span>
                  <span className="num">{ils(totals.total)}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-10 w-full rounded-md text-sm text-glow-3 transition-colors hover:bg-panel-2 hover:text-glow-2"
                >
                  המשך קנייה
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
