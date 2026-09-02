import Link from 'next/link';
import Image from 'next/image';
import type { AttentionItem } from '@/lib/insights';

const LED = { red: 'bg-led-red shadow-[0_0_6px_var(--led-red)]', amber: 'bg-led-amber shadow-[0_0_6px_var(--led-amber)]' };

export function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <section className="bg-paper-2 border border-rule rounded-lg p-5 h-full flex flex-col">
      <div className="text-[11px] font-medium tracking-wide text-ink-3">דורש טיפול</div>
      <h2 className="text-lg font-bold leading-tight mt-0.5">
        {items.length === 0 ? 'הכל תקין' : `${items.length} פריטים`}
      </h2>
      {items.length === 0 ? (
        <div className="flex-1 grid place-items-center py-4">
          <div className="text-center">
            <Image src="/brand/empty-tasks.webp" alt="" width={96} height={96} className="mx-auto rounded-full mix-blend-multiply opacity-90" />
            <p className="text-sm text-ink-2 mt-1">אין חשבוניות תקועות ואין לידים שנשכחו.</p>
          </div>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-rule -mx-2">
          {items.slice(0, 6).map((it, i) => (
            <li key={i}>
              <Link href={it.href} className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-paper-3 transition-colors">
                <span aria-hidden className={`size-2 rounded-full shrink-0 ${LED[it.severity]}`} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-ink truncate">{it.title}</span>
                  {it.hint && <span className="block text-xs text-ink-3 num truncate">{it.hint}</span>}
                </span>
                <span className="text-ink-3 text-xs">←</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
