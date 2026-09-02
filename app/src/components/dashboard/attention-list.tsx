import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import type { AttentionItem } from '@/lib/insights';

const LED = { red: 'bg-led-red shadow-[0_0_8px_var(--led-red)]', amber: 'bg-led-amber shadow-[0_0_8px_var(--led-amber)]' };

export function AttentionList({ items }: { items: AttentionItem[] }) {
  const reds = items.filter((i) => i.severity === 'red').length;
  return (
    <section className="panel p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium tracking-wide text-readout-3">דורש טיפול</div>
          <h2 className="text-lg font-bold leading-tight mt-0.5">{items.length === 0 ? 'הכל תקין' : `${items.length} פריטים`}</h2>
        </div>
        {reds > 0 && <span className="mono text-[10px] text-led-red border border-led-red/40 rounded px-1.5 py-0.5 mt-1">{reds} קריטי</span>}
      </div>
      {items.length === 0 ? (
        <div className="flex-1 grid place-items-center py-4">
          <div className="text-center">
            <div className="mx-auto size-24 rounded-full overflow-hidden ring-1 ring-white/10 bg-chassis-2">
              <Image src="/brand/empty-tasks.webp" alt="" width={96} height={96} className="opacity-90" />
            </div>
            <p className="text-sm text-readout-2 mt-2">אין חשבוניות תקועות ואין לידים שנשכחו.</p>
          </div>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-rule -mx-2">
          {items.slice(0, 6).map((it, i) => (
            <li key={i}>
              <Link href={it.href} className="group flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-chassis-2 transition-colors">
                <span aria-hidden className={`size-2 rounded-full shrink-0 ${LED[it.severity]}`} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-readout truncate">{it.title}</span>
                  {it.hint && <span className="block text-xs text-readout-3 num truncate">{it.hint}</span>}
                </span>
                <ChevronLeft className="size-4 text-readout-3 group-hover:text-signal transition-colors" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
