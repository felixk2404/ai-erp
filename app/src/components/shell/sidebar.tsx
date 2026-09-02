import Image from 'next/image';
import { NavLink } from './nav-link';
import { logout } from '@/app/(auth)/login/actions';
import { CommandMenuTrigger } from '@/components/command-menu';

export type NavCounts = { invoices: number; leads: number; tasks: number };

const LINKS = (c: NavCounts) => [
  { href: '/', label: 'דשבורד' },
  { href: '/invoices', label: 'חשבוניות', count: c.invoices },
  { href: '/leads', label: 'לידים', count: c.leads },
  { href: '/customers', label: 'לקוחות' },
  { href: '/products', label: 'מוצרים' },
  { href: '/tasks', label: 'משימות', count: c.tasks },
];

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2 pt-2">
      <Image src="/brand/logo.png" alt="" width={36} height={36} className="rounded-md mix-blend-multiply" priority />
      <div>
        <div className="text-[11px] font-medium tracking-wide text-ink-3">AI-ERP</div>
        <div className="font-display text-lg font-bold leading-tight">איי.איי אלקטרוניקה</div>
      </div>
    </div>
  );
}

/** ניווט טקסטואלי על אותו קנבס כמו התוכן — רק קו דק מפריד. הספירות אומרות "מה מחכה לי". */
export function Sidebar({ counts }: { counts: NavCounts }) {
  return (
    <aside className="hidden md:flex w-[232px] shrink-0 border-e border-rule flex-col p-4 gap-5 min-h-dvh sticky top-0 self-start">
      <Brand />
      <CommandMenuTrigger />
      <nav className="flex flex-col gap-1" aria-label="ראשי">
        {LINKS(counts).map((l) => (
          <NavLink key={l.href} {...l} />
        ))}
      </nav>
      <div className="mt-auto space-y-1">
        <a href="/support" target="_blank" rel="noreferrer" className="block text-xs text-ink-3 hover:text-ink px-3 h-8 leading-8 rounded-md transition-colors">
          עמוד שירות לקוחות ↗
        </a>
        <form action={logout}>
          <button type="submit" className="text-xs text-ink-3 hover:text-ink px-3 h-8 rounded-md transition-colors">
            יציאה
          </button>
        </form>
      </div>
    </aside>
  );
}

/** נייד: פס עליון עם המותג ושורת ניווט שנגללת אופקית. בלי JS. */
export function MobileNav({ counts }: { counts: NavCounts }) {
  return (
    <header className="md:hidden sticky top-0 z-20 bg-paper/95 backdrop-blur border-b border-rule">
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-2">
          <Image src="/brand/logo.png" alt="" width={24} height={24} className="rounded mix-blend-multiply" />
          <div className="font-display font-bold leading-none">איי.איי אלקטרוניקה</div>
        </div>
        <div className="flex items-center gap-1">
          <CommandMenuTrigger className="h-8 px-2 text-xs" />
          <form action={logout}>
            <button type="submit" className="text-xs text-ink-3 hover:text-ink h-8 px-2">
              יציאה
            </button>
          </form>
        </div>
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
