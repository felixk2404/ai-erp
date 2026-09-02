'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { LayoutDashboard, FileText, UserPlus, Users, Package, CheckSquare } from 'lucide-react';

export type NavIcon = 'dashboard' | 'invoices' | 'leads' | 'customers' | 'products' | 'tasks';
const ICONS = { dashboard: LayoutDashboard, invoices: FileText, leads: UserPlus, customers: Users, products: Package, tasks: CheckSquare } as const;

/** קישור ניווט: אייקון קו + תווית + ספירה. הפריט הפעיל מקבל פס ציאן קפיצי שמחליק בין הפריטים (layoutId). */
export function NavLink({ href, label, count, icon, layoutId = 'nav-active' }: { href: string; label: string; count?: number; icon: NavIcon; layoutId?: string }) {
  const Icon = ICONS[icon];
  const pathname = usePathname();
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center gap-2.5 rounded-md ps-3 pe-2.5 h-9 text-sm transition-colors duration-150 ${
        active ? 'text-signal font-medium' : 'text-readout-2 hover:bg-chassis-2 hover:text-readout'
      }`}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          aria-hidden
          className="absolute inset-0 rounded-md bg-signal-soft shadow-[inset_2px_0_0_var(--signal)]"
          transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.6 }}
        />
      )}
      <Icon className={`relative size-4 shrink-0 ${active ? 'text-signal' : 'text-readout-3 group-hover:text-readout-2'}`} strokeWidth={1.75} aria-hidden />
      <span className="relative flex-1">{label}</span>
      {count ? <span className={`relative num text-[11px] ${active ? 'text-signal' : 'text-readout-3'}`}>{count}</span> : null}
    </Link>
  );
}
