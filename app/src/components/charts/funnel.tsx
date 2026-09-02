import type { Funnel as FunnelData } from '@/lib/insights';
import { statusMeta } from '@/lib/status';

const OPACITY = ['opacity-100 shadow-[0_0_10px_var(--signal-glow)]', 'opacity-65', 'opacity-40'];

/** משפך לידים: 3 פסים אופקיים בגוון יחיד (signal) ב-3 בהירויות, רוחב יחסי לשלב הראשון. */
export function LeadsFunnel({ data }: { data: FunnelData }) {
  const max = Math.max(...data.stages.map((s) => s.count), 1);
  const total = data.stages.reduce((s, x) => s + x.count, 0);
  if (total === 0) return <p className="text-sm text-readout-3">אין לידים עדיין.</p>;
  return (
    <div className="space-y-2">
      {data.stages.map((s, i) => (
        <div key={s.status} className="grid grid-cols-[92px_1fr_32px] items-center gap-3 text-xs">
          <span className="text-readout-2">{statusMeta('Leads', s.status).label}</span>
          <div className="h-5 rounded-[4px] bg-well overflow-hidden border border-rule">
            <div className={`h-full rounded-[3px] bg-signal ${OPACITY[i]} transition-[width] duration-500 ease-out`} style={{ width: `${Math.max((s.count / max) * 100, s.count ? 6 : 0)}%` }} />
          </div>
          <span className="num text-readout text-end">{s.count}</span>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1 text-xs text-readout-3">
        <span>
          שיעור מענה: <span className="num text-readout">{data.conversion}%</span>
        </span>
        {Object.keys(data.other).length > 0 && (
          <span className="num">
            {Object.entries(data.other)
              .map(([k, v]) => `${statusMeta('Leads', k).label} ${v}`)
              .join(' · ')}
          </span>
        )}
      </div>
    </div>
  );
}
