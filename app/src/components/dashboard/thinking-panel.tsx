'use client';

import { useEffect, useState } from 'react';

const STEPS = ['קורא חשבוניות מ-Airtable', 'סופר לידים פתוחים', 'בודק משימות', 'מנסח תקציר'];

/** "הסוכן חושב": שורות מחשבה שמתחלפות, קו סריקה, וטיימר — במקום skeleton אפור. */
export function ThinkingPanel() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(t / 2))];
  return (
    <div className="mt-4 flex-1 flex flex-col" aria-busy="true" aria-live="polite">
      <div className="relative overflow-hidden rounded-md border border-rule bg-well/60 p-3 flex-1 min-h-[112px]">
        <div aria-hidden className="scanline absolute inset-x-0 h-16 pointer-events-none" />
        <div className="space-y-2.5">
          {STEPS.map((s, i) => {
            const state = i < Math.floor(t / 2) ? 'done' : s === step ? 'now' : 'todo';
            return (
              <div key={s} className={`flex items-center gap-2.5 text-xs ${state === 'todo' ? 'text-readout-3/60' : state === 'done' ? 'text-readout-3' : 'text-readout'}`}>
                <span aria-hidden className={`size-1.5 rounded-full ${state === 'done' ? 'bg-led-green' : state === 'now' ? 'bg-signal led-live' : 'bg-readout-3/40'}`} />
                <span className={state === 'now' ? 'shimmer' : ''}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px] text-readout-3">
        <span>הסוכן קורא את הנתונים…</span>
        <span className="mono" dir="ltr">
          {String(Math.floor(t / 60)).padStart(2, '0')}:{String(t % 60).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
