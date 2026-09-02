'use client';

import { useEffect, useState } from 'react';
import type { Pulse } from '@/lib/n8n-health';

const LED = {
  green: 'bg-led-green',
  amber: 'bg-led-amber',
  red: 'bg-led-red',
  off: 'bg-readout-3/50',
};

/** נורית n8n בסיידבר: polling /api/pulse כל 30 שניות. */
export function PulseDot() {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch('/api/pulse', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((p: Pulse | null) => alive && p && setPulse(p))
        .catch(() => {});
    load();
    const t = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  const led = pulse?.health?.led ?? 'off';
  const text = !pulse ? '…' : !pulse.connected ? 'n8n לא מחובר' : led === 'off' ? 'n8n · אין הרצות' : pulse.health!.error === 0 ? 'n8n · הכל רץ' : `n8n · ${pulse.health!.error} שגיאות`;
  return (
    <div className="flex items-center gap-2 px-3 h-8 text-xs text-readout-3" aria-live="polite">
      <span aria-hidden className={`size-2 rounded-full ${LED[led]} ${led !== 'off' ? 'led-live' : ''}`} />
      <span className="truncate">{text}</span>
      {pulse?.connected && pulse.health && <span className="num ms-auto text-[10px] text-readout-3">{pulse.health.total}/24h</span>}
    </div>
  );
}
