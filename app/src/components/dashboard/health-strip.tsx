import type { Health } from '@/lib/n8n-health';

const LED: Record<Health['led'], string> = {
  green: 'bg-led-green shadow-[0_0_6px_var(--led-green)]',
  amber: 'bg-led-amber shadow-[0_0_6px_var(--led-amber)]',
  red: 'bg-led-red shadow-[0_0_6px_var(--led-red)]',
  off: 'bg-ink-3/40',
};

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? 'עכשיו' : m < 60 ? `לפני ${m} דק׳` : `לפני ${Math.round(m / 60)} שע׳`;
};

/** בריאות האוטומציה: הרצות n8n ב-24 השעות האחרונות. */
export function HealthStrip({ health }: { health: Health | null }) {
  return (
    <section className="bg-paper-2 border border-rule rounded-lg p-5 h-full flex flex-col">
      <div className="text-[11px] font-medium tracking-wide text-ink-3">בריאות המערכת · n8n</div>
      {!health ? (
        <>
          <h2 className="text-lg font-bold leading-tight mt-0.5 text-ink-3">לא מחובר</h2>
          <p className="mt-3 text-xs text-ink-3">הגדר N8N_API_URL ו-N8N_API_KEY כדי לראות הרצות.</p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold leading-tight mt-0.5 inline-flex items-center gap-2">
            <span aria-hidden className={`size-2.5 rounded-full ${LED[health.led]}`} />
            {health.led === 'off' ? 'אין הרצות' : health.error === 0 ? 'הכל רץ' : `${health.error} שגיאות`}
          </h2>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ['הרצות', health.total],
              ['הצליחו', health.success],
              ['נכשלו', health.error],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-md bg-paper-3 py-2">
                <dd className="num text-lg font-medium leading-none">{v}</dd>
                <dt className="text-[11px] text-ink-3 mt-1">{k}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-auto pt-4 text-[11px] text-ink-3 space-y-0.5">
            {health.lastRunAt && <div>הרצה אחרונה {ago(health.lastRunAt)}</div>}
            {health.lastError && (
              <div className="text-led-red/90 truncate" title={health.lastError.workflow}>
                שגיאה אחרונה: {health.lastError.workflow} · {ago(health.lastError.at)}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
