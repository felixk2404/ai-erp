export type TimelineStep = { label: string; hint?: string; state: 'done' | 'current' | 'todo' | 'error' };

const DOT: Record<TimelineStep['state'], string> = {
  done: 'bg-led-green shadow-[0_0_6px_var(--led-green)]',
  current: 'bg-led-amber shadow-[0_0_8px_var(--led-amber)] led-live',
  error: 'bg-led-red shadow-[0_0_6px_var(--led-red)]',
  todo: 'bg-chassis border border-rule-strong',
};

/** ציר זמן אופקי של סטטוסים: נקודות LED מחוברות בקו דק. */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="flex items-start gap-0" aria-label="ציר זמן">
      {steps.map((s, i) => (
        <li key={s.label} className="flex-1 relative">
          {i < steps.length - 1 && <div aria-hidden className={`absolute top-[5px] start-1/2 w-full h-px ${s.state === 'done' ? 'bg-led-green/60' : 'bg-rule'}`} />}
          <div className="relative flex flex-col items-center text-center gap-2">
            <span className={`size-2.5 rounded-full relative z-10 ${DOT[s.state]}`} aria-hidden />
            <div>
              <div className={`text-xs font-medium ${s.state === 'todo' ? 'text-ink-3' : 'text-ink'}`}>{s.label}</div>
              {s.hint && <div className="text-[12px] text-ink-3 num">{s.hint}</div>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
