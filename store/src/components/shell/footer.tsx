import Link from 'next/link';
import { Wordmark } from '@/components/shell/wordmark';
import { EYEBROW } from '@/lib/ui';

const LINKS = [
  { href: '/products', label: 'מוצרים' },
  { href: '/track', label: 'מעקב הזמנה' },
  { href: '/policies', label: 'מדיניות' },
  { href: '/about', label: 'אודות' },
] as const;

/**
 * סגירה שקטה: אותה שפה של קווי rule, שלוש עמודות בדסקטופ ומחסנית במובייל.
 * שום beam כאן — האקסנט שמור לפעולות, והכותרת התחתונה היא מטא (glow-3).
 */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="container-x grid gap-10 py-12 md:grid-cols-3">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-[38ch] text-sm text-glow-2">מוצרים מקוריים, אחריות יבואן, ומשלוח עד הבית.</p>
        </div>

        <nav aria-labelledby="footer-nav">
          <h2 id="footer-nav" className={EYEBROW}>
            ניווט
          </h2>
          <ul className="mt-3 flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  transitionTypes={['nav-forward']}
                  className="flex h-10 items-center rounded-md text-sm text-glow-2 transition-colors hover:text-glow"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={EYEBROW}>שירות לקוחות</h2>
          <a
            href="https://t.me/aielec_support_bot"
            className="mt-3 flex h-11 w-fit items-center gap-2 rounded-md text-sm text-glow-2 transition-colors hover:text-glow"
          >
            בטלגרם
            <span dir="ltr" className="num text-body text-glow-3">
              @aielec_support_bot
            </span>
          </a>
        </div>
      </div>

      <div className="border-t border-rule">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-5 text-meta text-glow-3">
          <p>פרויקט הדגמה — לא מתבצע חיוב</p>
          <p>
            <span className="num">2026</span> · איי.איי אלקטרוניקה
          </p>
        </div>
      </div>
    </footer>
  );
}
