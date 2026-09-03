'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const GO: Record<string, [string, string]> = {
  d: ['/', 'דשבורד'],
  o: ['/orders', 'הזמנות'],
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

/** אירוע לפתיחת שכבת העזרה בלי לעבור דרך המקלדת — כדי שגם כשהקיצורים כבויים יש דרך פנימה. */
export const HELP_EVENT = 'erp:hotkeys-help';

const PREF = 'erp-hotkeys';
const readPref = () => localStorage.getItem(PREF) !== 'off';

/**
 * קיצורי מקלדת: `?` עזרה · `g` ואז אות = ניווט · `n` = פעולת "חדש" בעמוד (אלמנט עם data-hotkey="new") · ⌘K חיפוש (ב-CommandMenu).
 * לא פעיל בזמן הקלדה או כשדיאלוג פתוח.
 * WCAG 2.1.4 — קיצור בתו בודד חייב מתג כיבוי; המתג יושב בשכבת העזרה ונשמר ב-localStorage.
 * ⌘K לא נכלל: הוא דורש מקש צירוף ולכן לא נופל תחת 2.1.4.
 */
export function Hotkeys() {
  const [help, setHelp] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const router = useRouter();

  // נקרא בפתיחה ולא ב-effect: אין קפיצת הידרציה, ואין state שצריך לסנכרן עם הדפדפן
  const openHelp = useCallback(() => {
    setEnabled(readPref());
    setHelp((h) => !h);
  }, []);

  useEffect(() => {
    window.addEventListener(HELP_EVENT, openHelp);
    return () => window.removeEventListener(HELP_EVENT, openHelp);
  }, [openHelp]);

  useEffect(() => {
    let pendingG = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (!readPref()) return;
      const dialogOpen = !!document.querySelector('[role="dialog"][data-open], [role="dialog"][data-state="open"], [data-slot="dialog-content"], [data-slot="sheet-content"]');
      if (e.key === '?') {
        e.preventDefault();
        openHelp();
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
  }, [router, openHelp]);

  const toggle = (on: boolean) => {
    setEnabled(on);
    localStorage.setItem(PREF, on ? 'on' : 'off');
  };

  const rows: [string, string][] = [
    ['⌘ K', 'חיפוש וניווט · שאלה לסוכן'],
    ['?', 'שכבת העזרה הזו'],
    ['n', 'פריט חדש בעמוד הנוכחי'],
    ...Object.entries(GO).map(([k, [, label]]) => [`g ${k}`, label] as [string, string]),
    ['Esc', 'סגירה'],
  ];

  return (
    <Dialog open={help} onOpenChange={setHelp}>
      <DialogContent dir="rtl" className="max-w-sm p-5">
        <DialogTitle className="font-heading text-lg font-bold">קיצורי מקלדת</DialogTitle>
        <DialogDescription className="text-xs text-readout-3">חדר הבקרה נשלט מהמקלדת. לחץ ? בכל עמוד, או פתח את השכבה מכפתור ה-? בסרגל הצד.</DialogDescription>
        <label className="mt-3 flex items-center justify-between gap-3 rounded-md border border-rule bg-well px-3 py-2 text-sm">
          <span className="text-readout-2">קיצורי מקלדת פעילים</span>
          <input type="checkbox" checked={enabled} onChange={(e) => toggle(e.target.checked)} className="size-4 accent-[var(--signal)]" />
        </label>
        <ul className="mt-2 divide-y divide-rule">
          {rows.map(([k, label]) => (
            <li key={k} className="flex items-center justify-between py-2 text-sm">
              <span className="text-readout-2">{label}</span>
              <kbd dir="ltr" className="mono text-[12px] text-signal bg-well border border-rule-strong rounded px-1.5 py-0.5 min-w-8 text-center">
                {k}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/** ה-? בסרגל הצד היה <kbd title>: לא ממוקד, לא ניתן להפעלה, ו-title לא קיים במגע (4.1.2, 3.2.6). */
export function HotkeysHelpButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(HELP_EVENT))}
      aria-label="קיצורי מקלדת"
      className={`mono text-[10px] text-readout-3 hover:text-readout border border-rule rounded px-1.5 py-0.5 transition-colors ${className}`}
    >
      <span aria-hidden>?</span>
    </button>
  );
}
