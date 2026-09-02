'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export type CommandItem = { label: string; hint?: string; href: string; group: 'עמודים' | 'לקוחות' | 'חשבוניות' | 'מוצרים' };

const PAGES: CommandItem[] = [
  { label: 'דשבורד', href: '/', group: 'עמודים' },
  { label: 'חשבוניות', href: '/invoices', group: 'עמודים' },
  { label: 'לידים', href: '/leads', group: 'עמודים' },
  { label: 'לקוחות', href: '/customers', group: 'עמודים' },
  { label: 'מוצרים', href: '/products', group: 'עמודים' },
  { label: 'משימות', href: '/tasks', group: 'עמודים' },
  { label: 'שירות לקוחות (עמוד ציבורי)', href: '/support', group: 'עמודים' },
];

export const OPEN_EVENT = 'erp:command-menu';

/** ⌘K / Ctrl+K — ניווט וחיפוש. נפתח גם באירוע OPEN_EVENT מכפתור בסיידבר. */
export function CommandMenu({ items }: { items: CommandItem[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href, { transitionTypes: ['nav-forward'] });
  };

  const groups = ['עמודים', 'לקוחות', 'חשבוניות', 'מוצרים'] as const;
  const all = [...PAGES, ...items];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent dir="rtl" showCloseButton={false} className="p-0 overflow-hidden max-w-lg top-[20%] translate-y-0">
        <DialogTitle className="sr-only">חיפוש</DialogTitle>
        <Command label="חיפוש" className="bg-paper-2" loop>
          <Command.Input placeholder="חפש עמוד, לקוח, חשבונית או מוצר…" className="w-full h-12 px-4 bg-transparent border-b border-rule outline-none text-sm placeholder:text-ink-3" autoFocus />
          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-ink-3">לא נמצא כלום</Command.Empty>
            {groups.map((g) => {
              const rows = all.filter((i) => i.group === g);
              if (rows.length === 0) return null;
              return (
                <Command.Group key={g} heading={g} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-ink-3">
                  {rows.map((i) => (
                    <Command.Item
                      key={i.href + i.label}
                      value={`${i.label} ${i.hint ?? ''}`}
                      onSelect={() => go(i.href)}
                      className="flex items-center justify-between gap-3 rounded-md px-2 h-9 text-sm cursor-pointer data-[selected=true]:bg-inkblue-soft data-[selected=true]:text-inkblue"
                    >
                      <span className="truncate">{i.label}</span>
                      {i.hint && (
                        <span className="text-xs text-ink-3 num shrink-0" dir="ltr">
                          {i.hint}
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
          <div className="flex items-center justify-between px-3 h-9 border-t border-rule text-[11px] text-ink-3">
            <span>↑↓ ניווט · Enter בחירה · Esc סגירה</span>
            <span className="font-mono">⌘K</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function CommandMenuTrigger({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className={`flex items-center justify-between rounded-md border border-rule bg-paper-3 px-3 h-9 text-sm text-ink-2 hover:text-ink hover:border-rule-strong transition-colors ${className}`}
    >
      <span>חיפוש…</span>
      <kbd className="font-mono text-[11px] text-ink-3">⌘K</kbd>
    </button>
  );
}
