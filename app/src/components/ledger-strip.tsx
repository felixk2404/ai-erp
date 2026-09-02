import type { ReactNode } from 'react';

export type LedgerItem = { label: string; value: ReactNode; hint?: ReactNode; hero?: boolean };

/**
 * "שורת פנקס": רצועה אופקית אחת עם מספר גיבור ושאר הנתונים בדרגה נמוכה יותר.
 * קו תלישה מנוקד למטה — הרמז היחיד לעולם הפנקס.
 */
export function LedgerStrip({ items }: { items: LedgerItem[] }) {
  return (
    <section aria-label="סיכום" className="bg-paper-2 border border-rule rounded-lg">
      <div className="flex flex-wrap divide-x divide-x-reverse divide-rule">
        {items.map((it) => (
          <div key={it.label} className={`px-6 py-5 ${it.hero ? 'min-w-64' : 'min-w-44'}`}>
            <div className="text-[11px] font-medium tracking-wide text-ink-3">{it.label}</div>
            <div className={`num mt-1 ${it.hero ? 'text-[28px] leading-none font-semibold text-ink' : 'text-lg leading-tight font-medium text-ink'}`}>
              {it.value}
            </div>
            {it.hint !== undefined && <div className="mt-1.5 text-xs text-ink-3 num">{it.hint}</div>}
          </div>
        ))}
      </div>
      <div aria-hidden className="border-t border-dashed border-rule-strong mx-3" />
    </section>
  );
}
