'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const GO: Record<string, [string, string]> = {
  d: ['/', 'דשבורד'],
  i: ['/invoices', 'חשבוניות'],
  l: ['/leads', 'לידים'],
  c: ['/customers', 'לקוחות'],
  p: ['/products', 'מוצרים'],
  t: ['/tasks', 'משימות'],
};

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

/**
 * קיצורי מקלדת: `?` עזרה · `g` ואז אות = ניווט · `n` = פעולת "חדש" בעמוד (אלמנט עם data-hotkey="new") · ⌘K חיפוש (ב-CommandMenu).
 * לא פעיל בזמן הקלדה או כשדיאלוג פתוח.
 */
export function Hotkeys() {
  const [help, setHelp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let pendingG = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const dialogOpen = !!document.querySelector('[role="dialog"][data-open], [role="dialog"][data-state="open"], [data-slot="dialog-content"], [data-slot="sheet-content"]');
      if (e.key === '?') {
        e.preventDefault();
        setHelp((h) => !h);
        return;
      }
      if (dialogOpen) return;
      const k = e.key.toLowerCase();
      if (pendingG && Date.now() - pendingG < 900 && GO[k]) {
        e.preventDefault();
        pendingG = 0;
        router.push(GO[k][0], { transitionTypes: ['nav-forward'] });
        return;
      }
      pendingG = k === 'g' ? Date.now() : 0;
      if (k === 'n') {
        const btn = document.querySelector<HTMLElement>('[data-hotkey="new"]');
        if (btn) {
          e.preventDefault();
          btn.click();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  const rows: [string, string][] = [
    ['⌘K', 'חיפוש וניווט · שאלה לסוכן'],
    ['?', 'שכבת העזרה הזו'],
    ['n', 'פריט חדש בעמוד הנוכחי'],
    ...Object.entries(GO).map(([k, [, label]]) => [`g ${k}`, label] as [string, string]),
    ['Esc', 'סגירה'],
  ];

  return (
    <Dialog open={help} onOpenChange={setHelp}>
      <DialogContent dir="rtl" className="max-w-sm p-5">
        <DialogTitle className="font-heading text-lg font-bold">קיצורי מקלדת</DialogTitle>
        <DialogDescription className="text-xs text-readout-3">חדר הבקרה נשלט מהמקלדת. לחצו ? בכל עמוד.</DialogDescription>
        <ul className="mt-2 divide-y divide-rule">
          {rows.map(([k, label]) => (
            <li key={k} className="flex items-center justify-between py-2 text-sm">
              <span className="text-readout-2">{label}</span>
              <kbd dir="ltr" className="mono text-[11px] text-signal bg-well border border-rule-strong rounded px-1.5 py-0.5 min-w-8 text-center">
                {k}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
