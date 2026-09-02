import type { Funnel as FunnelData } from '@/lib/insights';
import { statusMeta } from '@/lib/status';

const OPACITY = ['opacity-100', 'opacity-70', 'opacity-45'];

/** משפך לידים: 3 פסים אופקיים בגוון יחיד ב-3 בהירויות, רוחב יחסי לשלב הראשון. */
export function LeadsFunnel({ data }: { data: FunnelData }) {
  const max = Math.max(...data.stages.map((s) => s.count), 1);
  const total = data.stages.reduce((s, x) => s + x.count, 0);
  if (total === 0) return <p className="text-sm text-ink-3">אין לידים עדיין.</p>;
  return (
    <div className="space-y-2">
      {data.stages.map((s, i) => (
        <div key={s.status} className="grid grid-cols-[92px_1fr_32px] items-center gap-3 text-xs">
          <span className="text-ink-2">{statusMeta('Leads', s.status).label}</span>
          <div className="h-5 rounded-[4px] bg-paper-3 overflow-hidden">
            <div className={`h-full rounded-[4px] bg-inkblue ${OPACITY[i]} transition-[width] duration-500 ease-out`} style={{ width: `${Math.max((s.count / max) * 100, s.count ? 6 : 0)}%` }} />
          </div>
          <span className="num text-ink text-end">{s.count}</span>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1 text-xs text-ink-3">
        <span>
          המרה לענו: <span className="num text-ink">{data.conversion}%</span>
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
