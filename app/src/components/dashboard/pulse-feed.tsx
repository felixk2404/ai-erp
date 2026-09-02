'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Pulse, PulseEvent } from '@/lib/n8n-health';

const LED: Record<PulseEvent['status'], string> = {
  success: 'bg-led-green',
  error: 'bg-led-red',
  running: 'bg-led-amber led-live',
};
const LABEL: Record<PulseEvent['status'], string> = { success: 'הצליח', error: 'נכשל', running: 'רץ' };

const ago = (iso: string, now: number) => {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'עכשיו';
  const m = Math.round(s / 60);
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.round(m / 60);
  return h < 24 ? `לפני ${h} שע׳` : `לפני ${Math.round(h / 24)} ימים`;
};
const fmtMs = (ms?: number) => (ms === undefined ? '' : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`);

/** "פעילות חיה": הרצות n8n, polling 10s. שורות חדשות נכנסות מלמעלה; קיימות לא מהבהבות (key=id). */
export function PulseFeed({ initial, interval = 10_000 }: { initial: Pulse; interval?: number }) {
  const [pulse, setPulse] = useState(initial);
  // זמן הבסיס מגיע מהשרת (initial.at) כדי שה-SSR וההידרציה יציגו אותו טקסט; מתעדכן אחרי mount.
  const [now, setNow] = useState(() => new Date(initial.at).getTime());

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch('/api/pulse', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((p: Pulse | null) => {
          if (alive && p) {
            setPulse(p);
            setNow(Date.now());
          }
        })
        .catch(() => {});
    load(); // רענון מיידי אחרי mount (גם מיישר את 'לפני X' לשעון הלקוח)
    const poll = setInterval(() => !document.hidden && load(), interval);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [interval]);

  const live = pulse.connected && pulse.health && pulse.health.led !== 'off';
  const events = pulse.events.slice(0, 8);

  return (
    <section className="panel p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-medium tracking-wide text-readout-3">פעילות חיה · n8n</div>
          <h2 className="text-lg font-bold leading-tight mt-0.5 inline-flex items-center gap-2">
            <span aria-hidden className={`size-2.5 rounded-full ${live ? 'bg-led-green led-live' : 'bg-readout-3/50'}`} />
            {!pulse.connected ? 'לא מחובר' : events.length === 0 ? 'שקט' : 'המערכת עובדת'}
          </h2>
        </div>
        {pulse.connected && <span className="mono text-[10px] text-readout-3 mt-1">LIVE · 10s</span>}
      </div>

      {!pulse.connected ? (
        <div className="mt-3 flex-1 flex flex-col">
          <ol aria-hidden className="-mx-2 space-y-0.5">
            {['סוכן המנהל', 'אימות חשבוניות', 'הפקת PDF', 'סוכן מכירות'].map((w, i) => (
              <li key={w} className="flex items-center gap-3 px-2 h-9 text-sm" style={{ opacity: 0.55 - i * 0.12 }}>
                <span className="size-2 rounded-full bg-readout-3/40 shrink-0" />
                <span className="flex-1 text-readout-3">{w}</span>
                <span className="mono text-[12px] text-readout-3/70">—</span>
                <span className="mono text-[12px] text-readout-3/70 w-[76px] text-end">--:--</span>
              </li>
            ))}
          </ol>
          <div className="mt-auto rounded-md border border-rule bg-well/70 p-3 text-[12px] text-readout-3 leading-relaxed">
            כדי להדליק את הפיד: <span className="mono text-readout-2">N8N_API_URL</span> + <span className="mono text-readout-2">N8N_API_KEY</span> ב-env. כל הרצה של סוכן תופיע כאן תוך 10 שניות.
          </div>
        </div>
      ) : events.length === 0 ? (
        <p className="mt-3 text-xs text-readout-3">אין הרצות עדיין. שלח ליד או צור חשבונית ותראה אותן כאן.</p>
      ) : (
        <ol className="mt-3 -mx-2 flex-1" aria-live="polite" aria-relevant="additions">
          <AnimatePresence initial={false} mode="popLayout">
            {events.map((e) => (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', bounce: 0.15, visualDuration: 0.3 }}
                className="flex items-center gap-3 px-2 h-9 rounded-md text-sm"
              >
                <span aria-hidden className={`size-2 rounded-full shrink-0 ${LED[e.status]}`} />
                <span className="flex-1 min-w-0 truncate text-readout">{e.workflow}</span>
                <span className="sr-only">{LABEL[e.status]}</span>
                <span className="mono text-[12px] text-readout-3 shrink-0" dir="ltr">
                  {fmtMs(e.ms)}
                </span>
                <span className="text-[12px] text-readout-3 shrink-0 num w-[76px] text-end">{ago(e.at, now)}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
      {pulse.connected && pulse.health && (
        <div className="mt-auto pt-3 flex items-center gap-4 text-[12px] text-readout-3 num border-t border-rule">
          <span>
            24h · <span className="text-readout">{pulse.health.total}</span> הרצות
          </span>
          <span>
            <span className="text-led-green">{pulse.health.success}</span> הצליחו
          </span>
          <span>
            <span className={pulse.health.error ? 'text-led-red' : 'text-readout'}>{pulse.health.error}</span> נכשלו
          </span>
        </div>
      )}
    </section>
  );
}
