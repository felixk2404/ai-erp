import { NavLink } from './nav-link';
import { logout } from '@/app/(auth)/login/actions';

export type NavCounts = { invoices: number; leads: number; tasks: number };

const LINKS = (c: NavCounts) => [
  { href: '/', label: 'דשבורד' },
  { href: '/invoices', label: 'חשבוניות', count: c.invoices },
  { href: '/leads', label: 'לידים', count: c.leads },
  { href: '/customers', label: 'לקוחות' },
  { href: '/products', label: 'מוצרים' },
  { href: '/tasks', label: 'משימות', count: c.tasks },
];

/** ניווט טקסטואלי על אותו קנבס כמו התוכן — רק קו דק מפריד. הספירות אומרות "מה מחכה לי". */
export function Sidebar({ counts }: { counts: NavCounts }) {
  return (
    <aside className="hidden md:flex w-[232px] shrink-0 border-e border-rule flex-col p-4 gap-6 min-h-dvh sticky top-0 self-start">
      <div className="px-3 pt-2">
        <div className="text-[11px] font-medium tracking-wide text-ink-3">AI-ERP</div>
        <div className="font-display text-lg font-bold leading-tight">איי.איי אלקטרוניקה</div>
      </div>
      <nav className="flex flex-col gap-1" aria-label="ראשי">
        {LINKS(counts).map((l) => (
          <NavLink key={l.href} {...l} />
        ))}
      </nav>
      <form action={logout} className="mt-auto">
        <button type="submit" className="text-xs text-ink-3 hover:text-ink px-3 h-8 rounded-md transition-colors">
          יציאה
        </button>
      </form>
    </aside>
  );
}

/** נייד: פס עליון עם המותג ושורת ניווט שנגללת אופקית. בלי JS. */
export function MobileNav({ counts }: { counts: NavCounts }) {
  return (
    <header className="md:hidden sticky top-0 z-20 bg-paper/95 backdrop-blur border-b border-rule">
      <div className="flex items-center justify-between px-4 h-12">
        <div className="font-display font-bold leading-none">איי.איי אלקטרוניקה</div>
        <form action={logout}>
          <button type="submit" className="text-xs text-ink-3 hover:text-ink h-8 px-2">
            יציאה
          </button>
        </form>
      </div>
      <nav aria-label="ראשי" className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
        {LINKS(counts).map((l) => (
          <div key={l.href} className="shrink-0">
            <NavLink {...l} />
          </div>
        ))}
      </nav>
    </header>
  );
}
