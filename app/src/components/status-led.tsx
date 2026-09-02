import { statusMeta, type Led } from '@/lib/status';
import type { TableName } from '@/lib/types';

const LED: Record<Led, string> = {
  green: 'bg-led-green shadow-[0_0_6px_var(--led-green)]',
  amber: 'bg-led-amber shadow-[0_0_6px_var(--led-amber)]',
  red: 'bg-led-red shadow-[0_0_6px_var(--led-red)]',
  off: 'bg-ink-3/40',
};

/** נורית סטטוס: נקודה 8px עם זוהר עדין + תווית בעברית. */
export function StatusLed({ table, status, className = '' }: { table: TableName; status?: string; className?: string }) {
  const m = statusMeta(table, status);
  return (
    <span className={`inline-flex items-center gap-2 text-ink-2 whitespace-nowrap ${className}`}>
      <span aria-hidden className={`size-2 rounded-full shrink-0 ${LED[m.led]}`} />
      {m.label}
    </span>
  );
}
