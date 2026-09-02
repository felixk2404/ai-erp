/**
 * מלאי בינארי ללקוח: נקודה + מילה, לעולם לא מספר (החלטת המוצר).
 * הנקודה נושאת את הצבע כדי שהטקסט יישאר בסולם הטקסט הרגיל ולא יתחרה ב-beam.
 */
export function StockBadge({ ok, className = '' }: { ok: boolean; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 text-[14px] whitespace-nowrap text-glow-2 ${className}`}>
      <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${ok ? 'bg-ok' : 'bg-bad'}`} />
      {ok ? 'במלאי' : 'אזל'}
    </span>
  );
}
