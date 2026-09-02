import Image from 'next/image';
import { LayoutGroup } from 'motion/react';
import { NavLink, type NavIcon } from './nav-link';
import { PulseDot } from './pulse-dot';
import { logout } from '@/app/(auth)/login/actions';
import { CommandMenuTrigger } from '@/components/command-menu';
import { HotkeysHelpButton } from './hotkeys';

export type NavCounts = { invoices: number; leads: number; tasks: number };

const LINKS = (c: NavCounts): { href: string; label: string; count?: number; icon: NavIcon }[] => [
  { href: '/', label: 'דשבורד', icon: 'dashboard' },
  { href: '/invoices', label: 'חשבוניות', count: c.invoices, icon: 'invoices' },
  { href: '/leads', label: 'לידים', count: c.leads, icon: 'leads' },
  { href: '/customers', label: 'לקוחות', icon: 'customers' },
  { href: '/products', label: 'מוצרים', icon: 'products' },
  { href: '/tasks', label: 'משימות', count: c.tasks, icon: 'tasks' },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'px-2 pt-2'}`}>
      <span className="relative shrink-0">
        <Image src="/brand/logo-mark.png" alt="" width={compact ? 28 : 40} height={compact ? 28 : 40} priority />
        <span aria-hidden className="absolute -inset-1 rounded-lg bg-signal/20 blur-md -z-10" />
      </span>
      <div className="leading-tight">
        <div className="mono text-[10px] tracking-[0.18em] text-signal/80">AI-ERP · CONSOLE</div>
        <div className={`font-heading font-bold whitespace-nowrap ${compact ? 'text-sm' : 'text-[15px]'}`}>איי.איי אלקטרוניקה</div>
      </div>
    </div>
  );
}

/** ניווט על אותו קנבס כמו התוכן — קו דק מפריד. הספירות אומרות "מה מחכה לי". LED n8n בתחתית. */
export function Sidebar({ counts }: { counts: NavCounts }) {
  return (
    <aside className="hidden md:flex w-[236px] shrink-0 border-e border-rule flex-col p-4 gap-5 min-h-dvh sticky top-0 self-start">
      <Brand />
      <CommandMenuTrigger />
      <LayoutGroup id="desktop-nav">
        <nav className="flex flex-col gap-0.5" aria-label="ראשי">
          {LINKS(counts).map((l) => (
            <NavLink key={l.href} {...l} />
          ))}
        </nav>
      </LayoutGroup>
      <div className="mt-auto space-y-2">
        <PulseDot />
        <a href="/support" target="_blank" rel="noreferrer" className="block text-xs text-readout-3 hover:text-readout px-3 h-8 leading-8 rounded-md transition-colors">
          עמוד שירות לקוחות ↗
        </a>
        <div className="flex items-center justify-between px-3">
          <form action={logout}>
            <button type="submit" className="text-xs text-readout-3 hover:text-readout h-8 rounded-md transition-colors">
              יציאה
            </button>
          </form>
          <HotkeysHelpButton />
        </div>
      </div>
    </aside>
  );
}

/** נייד: פס עליון עם המותג ושורת ניווט שנגללת אופקית. */
export function MobileNav({ counts }: { counts: NavCounts }) {
  return (
    <header className="md:hidden sticky top-0 z-20 bg-void/85 backdrop-blur-md border-b border-rule">
      <div className="flex items-center justify-between px-4 h-12">
        <Brand compact />
        <div className="flex items-center gap-1">
          <CommandMenuTrigger className="h-8 px-2 text-xs" />
          <form action={logout}>
            <button type="submit" className="text-xs text-readout-3 hover:text-readout h-8 px-2">
              יציאה
            </button>
          </form>
        </div>
      </div>
      <LayoutGroup id="mobile-nav">
        <nav aria-label="ראשי" className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [mask-image:linear-gradient(to_left,transparent,black_28px,black_calc(100%-28px),transparent)]">
          {LINKS(counts).map((l) => (
            <div key={l.href} className="shrink-0">
              <NavLink {...l} layoutId="nav-active-mobile" />
            </div>
          ))}
        </nav>
      </LayoutGroup>
    </header>
  );
}
