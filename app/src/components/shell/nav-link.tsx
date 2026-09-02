'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLink({ href, label, count }: { href: string; label: string; count?: number }) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center justify-between rounded-md px-3 h-9 text-sm transition-colors duration-150 ${
        active ? 'bg-inkblue-soft text-inkblue font-medium' : 'text-ink-2 hover:bg-paper-3 hover:text-ink'
      }`}
    >
      <span>{label}</span>
      {count ? <span className="num text-xs text-ink-3">{count}</span> : null}
    </Link>
  );
}
