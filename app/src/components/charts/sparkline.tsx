/**
 * Sparkline — SVG טהור (server-safe). קו ציאן 1.5px, מילוי gradient עדין, נקודה בקצה.
 * dataviz: סדרה אחת, גוון יחיד, בלי צירים — ההקשר מגיע מהתווית שלידו.
 */
export function Sparkline({ values, width = 104, height = 30, className = '' }: { values: number[]; width?: number; height?: number; className?: string }) {
  const n = values.length;
  if (n < 2) return null;
  const max = Math.max(...values, 1);
  const pad = 3;
  const pts = values.map((v, i) => [pad + (i / (n - 1)) * (width - pad * 2), height - pad - (v / max) * (height - pad * 2)] as const);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${d} L${pts[n - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;
  const [lx, ly] = pts[n - 1];
  const id = `sp-${width}-${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden style={{ direction: "ltr", overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.28} />
          <stop offset="100%" stopColor="var(--signal)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke="var(--signal)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={2.5} fill="var(--signal)" style={{ filter: 'drop-shadow(0 0 4px var(--signal))' }} />
    </svg>
  );
}
