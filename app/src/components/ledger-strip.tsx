import type { ReactNode } from 'react';
import type { Delta } from '@/lib/insights';
import { Sparkline } from '@/components/charts/sparkline';
import { SignalBeams } from '@/components/motion/signal-beams';

export type LedgerItem = { label: string; value: ReactNode; hint?: ReactNode; hero?: boolean; series?: number[]; delta?: Delta };

function DeltaChip({ d }: { d: Delta }) {
  if (d.pct === null) return <span className="mono text-[12px] text-readout-3">— אין השוואה</span>;
  const up = d.pct >= 0;
  return (
    <span className={`inline-flex items-center gap-1 mono text-[12px] ${up ? 'text-led-green' : 'text-led-red'}`}>
      <span aria-hidden>{up ? '▲' : '▼'}</span>
      <span className="sr-only">{up ? 'עלייה של' : 'ירידה של'}</span>
      {Math.abs(d.pct)}%
      <span className="sr-only">מול החודש הקודם</span>
    </span>
  );
}

/**
 * "רצועת קריאה": רצועה אופקית אחת עם מספר גיבור (36/800, זוהר) ושאר הנתונים בדרגה נמוכה יותר.
 * קו האות (SignalBeams) נע לאורך המפרידים. sparkline + דלתא לפריטים שיש להם סדרה. בנייד: רשת 2×2.
 */
export function LedgerStrip({ items, beams = false }: { items: LedgerItem[]; beams?: boolean }) {
  return (
    <section aria-label="סיכום" className="panel overflow-hidden">
      {beams && <SignalBeams desktop={{ rows: 1, cols: items.length }} mobile={{ rows: Math.ceil(items.length / 2), cols: 2 }} />}
      <div className="relative grid grid-cols-2 md:flex md:divide-x md:divide-x-reverse md:divide-rule">
        {items.map((it) => (
          <div key={it.label} className={`px-5 py-4 md:px-6 md:py-5 ${it.hero ? 'col-span-2 md:flex-[1.7] border-b border-rule md:border-b-0' : 'md:flex-1 odd:border-e odd:border-rule md:odd:border-e-0'}`}>
            <div className="text-[12px] font-medium tracking-wide text-readout-3">{it.label}</div>
            <div className="flex items-end justify-between gap-4">
              <div className={`num mt-1 whitespace-nowrap ${it.hero ? 'text-[30px] leading-none font-medium text-readout glow-text' : 'text-[20px] leading-tight font-medium text-readout'}`}>{it.value}</div>
              {it.series && <Sparkline values={it.series} width={it.hero ? 110 : 84} height={it.hero ? 32 : 26} className="shrink-0 mb-0.5 hidden sm:block" />}
            </div>
            {(it.hint !== undefined || it.delta) && (
              <div className="mt-1.5 flex items-center gap-2 text-xs text-readout-3 num">
                {it.delta && <DeltaChip d={it.delta} />}
                {it.delta && it.hint !== undefined && <span aria-hidden>·</span>}
                {it.hint !== undefined && <span>{it.hint}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
