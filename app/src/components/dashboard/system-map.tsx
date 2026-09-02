import type { NodeStatus, Pulse } from '@/lib/n8n-health';
import { ROLE_LABEL } from '@/lib/workflows';

const LED: Record<NodeStatus['led'], string> = {
  green: 'var(--led-green)',
  amber: 'var(--led-amber)',
  red: 'var(--led-red)',
  off: 'var(--readout-3)',
};

const W = 480;
const H = 300;
const CX = W / 2;
const CY = H / 2;
const RX = 140;
const RY = 112;

const ago = (iso?: string) => {
  if (!iso) return 'לא רץ ב-24h';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? 'עכשיו' : m < 60 ? `לפני ${m} דק׳` : `לפני ${Math.round(m / 60)} שע׳`;
};

/**
 * מפת מערכת: ה-API במרכז, 12 workflows על אליפסה סביבו. קו מסלול לכל צומת;
 * צמתים שרצו ב-24h מקבלים "פקטה" שנעה על המסלול (stroke-dash). LED = סטטוס. רשימה מתחת = זהות לא רק בצבע.
 */
export function SystemMap({ pulse }: { pulse: Pulse }) {
  const hub = pulse.nodes.find((n) => n.role === 'hub')!;
  const ring = pulse.nodes.filter((n) => n.role !== 'hub');
  const placed = ring.map((n, i) => {
    const a = -Math.PI / 2 + (i / ring.length) * Math.PI * 2;
    const x = CX + RX * Math.cos(a);
    const y = CY + RY * Math.sin(a);
    const side = Math.cos(a) > 0.35 ? 'right' : Math.cos(a) < -0.35 ? 'left' : Math.sin(a) < 0 ? 'top' : 'bottom';
    return { n, x, y, side };
  });
  const live = pulse.nodes.filter((n) => n.runs24h > 0).length;

  return (
    <section className="panel hud p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium tracking-wide text-readout-3">מפת המערכת · 13 workflows</div>
          <h2 className="text-lg font-bold leading-tight mt-0.5">{pulse.connected ? `${live} פעילים ב-24 השעות האחרונות` : 'המערכת לא מחוברת ל-n8n'}</h2>
        </div>
        <span className="mono text-[10px] text-readout-3 mt-1">{pulse.connected ? 'ONLINE' : 'OFFLINE'}</span>
      </div>

      <div className="relative mt-2 -mx-2 hud-grid rounded-md">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="מפת ה-workflows של המערכת">
          <style>{`
            .trace { stroke: var(--rule-strong); stroke-width: 1; fill: none; }
            .packet { stroke: var(--signal); stroke-width: 1.5; fill: none; stroke-dasharray: 10 220; stroke-linecap: round; animation: packet 3.6s linear infinite; opacity: .9; }
            @keyframes packet { to { stroke-dashoffset: -230; } }
            @media (prefers-reduced-motion: reduce) { .packet { animation: none; opacity: 0; } }
            .lbl { font-size: 10.5px; fill: var(--readout-2); font-family: inherit; }
            .sub { font-size: 8.5px; fill: var(--readout-3); font-family: var(--font-plex-mono), monospace; }
          `}</style>
          {placed.map(({ n, x, y }, i) => (
            <g key={n.key}>
              <line x1={CX} y1={CY} x2={x} y2={y} className="trace" />
              {n.runs24h > 0 && <line x1={CX} y1={CY} x2={x} y2={y} className="packet" style={{ animationDelay: `${-(i * 0.45)}s` }} />}
            </g>
          ))}
          {/* hub */}
          <g>
            <circle cx={CX} cy={CY} r={30} fill="var(--chassis)" stroke="var(--signal)" strokeOpacity={0.5} />
            <circle cx={CX} cy={CY} r={30} fill="none" stroke="var(--signal)" strokeOpacity={0.18} strokeWidth={8} />
            <circle cx={CX} cy={CY} r={4} fill={LED[hub.led]} style={hub.led !== 'off' ? { filter: `drop-shadow(0 0 5px ${LED[hub.led]})` } : undefined} />
            <text x={CX} y={CY - 8} textAnchor="middle" className="lbl" style={{ fill: 'var(--readout)', fontWeight: 600 }}>
              API
            </text>
            <text x={CX} y={CY + 16} textAnchor="middle" className="sub">
              {hub.runs24h}/24h
            </text>
            <title>{`${hub.name} · ${ROLE_LABEL[hub.role]} · ${ago(hub.lastRunAt)}`}</title>
          </g>
          {placed.map(({ n, x, y, side }) => {
            // SVG ב-direction:rtl: 'end' מעגן בקצה השמאלי (הטקסט נמשך ימינה) — לכן צומת בצד ימין מקבל 'end' וצומת בצד שמאל 'start'.
            const anchor = side === 'right' ? 'end' : side === 'left' ? 'start' : 'middle';
            const lx = side === 'right' ? x + 14 : side === 'left' ? x - 14 : x;
            const ly = side === 'top' ? y - 16 : side === 'bottom' ? y + 22 : y + 4;
            const glow = n.led !== 'off' ? { filter: `drop-shadow(0 0 5px ${LED[n.led]})` } : undefined;
            return (
              <g key={n.key}>
                <circle cx={x} cy={y} r={9} fill="var(--chassis-2)" stroke={n.led === 'off' ? 'var(--rule-strong)' : LED[n.led]} strokeOpacity={n.led === 'off' ? 1 : 0.6} />
                <circle cx={x} cy={y} r={3} fill={LED[n.led]} style={glow} />
                <text x={lx} y={ly} textAnchor={anchor} className="lbl" style={{ direction: 'rtl' }}>
                  {n.name}
                </text>
                <title>{`${n.name} · ${ROLE_LABEL[n.role]} · ${n.runs24h} הרצות, ${n.errors24h} שגיאות · ${ago(n.lastRunAt)}`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px]" aria-label="סטטוס לפי workflow">
        {pulse.nodes.map((n) => (
          <li key={n.key} className="flex items-center gap-2 min-w-0">
            <span aria-hidden className="size-1.5 rounded-full shrink-0" style={{ background: LED[n.led] }} />
            <span className="truncate text-readout-2">{n.name}</span>
            <span className="num ms-auto text-readout-3 shrink-0">{n.runs24h ? `${n.runs24h}${n.errors24h ? `·${n.errors24h}!` : ''}` : '—'}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
