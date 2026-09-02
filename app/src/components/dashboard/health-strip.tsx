import type { Health } from '@/lib/n8n-health';

const LED: Record<Health['led'], string> = {
  green: 'bg-led-green led-live',
  amber: 'bg-led-amber led-live',
  red: 'bg-led-red led-live',
  off: 'bg-readout-3/50',
};

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? 'עכשיו' : m < 60 ? `לפני ${m} דק׳` : `לפני ${Math.round(m / 60)} שע׳`;
};

/** בריאות האוטומציה: הרצות n8n ב-24 השעות האחרונות. */
export function HealthStrip({ health }: { health: Health | null }) {
  const ok = health && health.total > 0 ? Math.round((health.success / health.total) * 100) : null;
  return (
    <section className="panel p-5 h-full flex flex-col">
      <div className="text-[12px] font-medium tracking-wide text-readout-3">בריאות המערכת · n8n</div>
      {!health ? (
        <>
          <h2 className="text-lg font-bold leading-tight mt-0.5 inline-flex items-center gap-2 text-readout-3">
            <span aria-hidden className="size-2.5 rounded-full bg-readout-3/40" />
            לא מחובר
          </h2>
          <dl aria-hidden className="mt-4 grid grid-cols-3 gap-2 text-center opacity-50">
            {['הרצות', 'הצליחו', 'נכשלו'].map((k) => (
              <div key={k} className="rounded-md bg-well border border-rule py-2">
                <dd className="mono text-lg leading-none text-readout-3">–</dd>
                <dt className="text-[12px] text-readout-3 mt-1">{k}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-auto pt-4 text-[12px] text-readout-3 leading-relaxed">
            <span className="mono text-readout-2">N8N_API_URL</span> + <span className="mono text-readout-2">N8N_API_KEY</span> מדליקים את הבריאות, הפיד ומפת המערכת.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold leading-tight mt-0.5 inline-flex items-center gap-2">
            <span aria-hidden className={`size-2.5 rounded-full ${LED[health.led]}`} />
            {health.led === 'off' ? 'אין הרצות' : health.error === 0 ? 'הכל רץ' : `${health.error} שגיאות`}
          </h2>
          {ok !== null && (
            <div className="mt-4">
              <div className="flex items-baseline justify-between text-[12px] text-readout-3">
                <span>הצלחה</span>
                <span className="num text-readout">{ok}%</span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-well overflow-hidden">
                <div className={`h-full rounded-full ${health.led === 'red' ? 'bg-led-red' : 'bg-led-green'} shadow-[0_0_8px_currentColor]`} style={{ width: `${ok}%` }} />
              </div>
            </div>
          )}
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {(
              [
                ['הרצות', health.total, 'text-readout'],
                ['הצליחו', health.success, 'text-led-green'],
                ['נכשלו', health.error, health.error ? 'text-led-red' : 'text-readout'],
              ] as const
            ).map(([k, v, cls]) => (
              <div key={k} className="rounded-md bg-well border border-rule py-2">
                <dd className={`num text-lg font-medium leading-none ${cls}`}>{v}</dd>
                <dt className="text-[12px] text-readout-3 mt-1">{k}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-auto pt-4 text-[12px] text-readout-3 space-y-0.5">
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
