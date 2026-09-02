'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MenuIcon, ShoppingBagIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Wordmark } from '@/components/shell/wordmark';
import { useCart } from '@/components/cart/cart-provider';

const NAV = [
  { href: '/products', label: 'מוצרים' },
  { href: '/track', label: 'מעקב הזמנה' },
  { href: '/policies', label: 'מדיניות' },
] as const;

const SPRING = { type: 'spring' as const, bounce: 0.2, visualDuration: 0.3 };

function NavLink({ href, label, active, mobile = false, onClick }: { href: string; label: string; active: boolean; mobile?: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      transitionTypes={['nav-forward']}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={
        mobile
          ? `flex h-12 items-center rounded-md border-s-2 px-3 text-base font-medium transition-colors ${active ? 'border-beam bg-panel-2 text-glow' : 'border-transparent text-glow-2 hover:bg-panel-2 hover:text-glow'}`
          : `relative flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors ${active ? 'text-glow' : 'text-glow-2 hover:text-glow'}`
      }
    >
      {label}
      {!mobile && active && <motion.span layoutId="nav-underline" aria-hidden className="absolute inset-x-3 bottom-2 h-px bg-beam" transition={SPRING} />}
    </Link>
  );
}

/**
 * הפס העליון של חדר התצוגה: זכוכית כהה מטושטשת מעל התוכן, קו rule יחיד למטה.
 * בהתחלה — המותג (מקור האור) והניווט; בסוף — העגלה, נקודת הכובד היחידה עם beam.
 */
export function Header() {
  const pathname = usePathname();
  const { totals, setOpen } = useCart();
  const [menu, setMenu] = useState(false);
  const count = totals.count;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-void/85 backdrop-blur-md supports-backdrop-filter:bg-void/65">
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Sheet open={menu} onOpenChange={setMenu}>
            <SheetTrigger
              render={<button type="button" aria-label="פתיחת תפריט" className="grid size-11 place-items-center rounded-md text-glow-2 transition-colors hover:bg-panel-2 hover:text-glow md:hidden" />}
            >
              <MenuIcon size={20} strokeWidth={1.75} aria-hidden />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-rule bg-panel-1 p-0">
              <SheetTitle className="flex h-16 items-center border-b border-rule px-5 text-start text-sm font-medium text-glow-3">תפריט</SheetTitle>
              <nav aria-label="ניווט ראשי" className="flex flex-col gap-1 p-2">
                {NAV.map((item) => (
                  <NavLink key={item.href} {...item} mobile active={isActive(item.href)} onClick={() => setMenu(false)} />
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" transitionTypes={['nav-back']} className="flex h-11 items-center rounded-md px-2" aria-label="איי.איי אלקטרוניקה — לדף הבית">
            <Wordmark />
          </Link>

          <nav aria-label="ניווט ראשי" className="ms-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink key={item.href} {...item} active={isActive(item.href)} />
            ))}
          </nav>
        </div>

        <button
          type="button"
          data-cart-target
          onClick={() => setOpen(true)}
          aria-label={`עגלה, ${count} פריטים`}
          className="relative grid size-11 shrink-0 place-items-center rounded-md text-glow-2 transition-colors hover:bg-panel-2 hover:text-glow"
        >
          <ShoppingBagIcon size={20} strokeWidth={1.75} aria-hidden />
          <AnimatePresence initial={false}>
            {count > 0 && (
              <motion.span
                key={count}
                aria-hidden
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.35, visualDuration: 0.25 }}
                className="num absolute top-1.5 end-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-beam px-1 text-[11px] leading-none font-medium text-void"
              >
                {count}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      <span aria-live="polite" className="sr-only">{`${count} פריטים בעגלה`}</span>
    </header>
  );
}
