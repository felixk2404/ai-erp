import { NavLink } from './nav-link';
import { logout } from '@/app/(auth)/login/actions';

export type NavCounts = { invoices: number; leads: number; tasks: number };

/** ניווט טקסטואלי על אותו קנבס כמו התוכן — רק קו דק מפריד. הספירות אומרות "מה מחכה לי". */
export function Sidebar({ counts }: { counts: NavCounts }) {
  return (
    <aside className="w-[232px] shrink-0 border-e border-rule flex flex-col p-4 gap-6 min-h-dvh sticky top-0">
      <div className="px-3 pt-2">
        <div className="text-[11px] font-medium tracking-wide text-ink-3">AI-ERP</div>
        <div className="font-display text-lg font-bold leading-tight">איי.איי אלקטרוניקה</div>
      </div>
      <nav className="flex flex-col gap-1" aria-label="ראשי">
        <NavLink href="/" label="דשבורד" />
        <NavLink href="/invoices" label="חשבוניות" count={counts.invoices} />
        <NavLink href="/leads" label="לידים" count={counts.leads} />
        <NavLink href="/customers" label="לקוחות" />
        <NavLink href="/products" label="מוצרים" />
        <NavLink href="/tasks" label="משימות" count={counts.tasks} />
      </nav>
      <form action={logout} className="mt-auto">
        <button type="submit" className="text-xs text-ink-3 hover:text-ink px-3 h-8 rounded-md transition-colors">
          יציאה
        </button>
      </form>
    </aside>
  );
}
