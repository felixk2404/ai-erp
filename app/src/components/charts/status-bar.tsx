import type { StatusRow } from '@/lib/insights';
import { statusMeta } from '@/lib/status';
import { Money } from '@/components/money';

const FILL: Record<string, string> = {
  new: 'bg-led-amber/55',
  validated: 'bg-led-amber',
  generated: 'bg-led-green/60',
  paid: 'bg-led-green',
  error: 'bg-led-red',
};

/** פס יחיד מחולק לפי סטטוס בפלטת ה-LED, רווח 2px בין מקטעים, legend עם מספרים (זהות לא רק בצבע). */
export function StatusBar({ rows }: { rows: StatusRow[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const shown = rows.filter((r) => r.count > 0);
  if (total === 0) return <p className="text-sm text-readout-3">אין חשבוניות עדיין.</p>;
  return (
    <div>
      <div className="flex h-2.5 w-full gap-0.5 rounded-full overflow-hidden bg-well p-px" role="img" aria-label={`חלוקת ${total} חשבוניות לפי סטטוס`}>
        {shown.map((r) => (
          <div key={r.status} className={`${FILL[r.status]} h-full rounded-full`} style={{ width: `${(r.count / total) * 100}%` }} title={`${statusMeta('Invoices', r.status).label}: ${r.count}`} />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {shown.map((r) => (
          <li key={r.status} className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-readout-2">
              <span aria-hidden className={`size-2 rounded-full ${FILL[r.status]}`} />
              {statusMeta('Invoices', r.status).label}
            </span>
            <span className="num text-readout">
              {r.count} · <Money value={r.total} className="text-readout-2" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
