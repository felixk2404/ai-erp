'use client';

import { useState } from 'react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthRow } from '@/lib/insights';
import { ils } from '@/lib/format';

/**
 * הכנסות לפי חודש — סדרה אחת, גוון יחיד (signal), עמודות דקות עם קצה מעוגל 4px ו-gradient,
 * ערכים ישירים מעל העמודות (≤ 6 חודשים), ציר y מוסתר, tooltip + readout HUD בפינה. (dataviz: no dual axis, thin marks)
 */
export function RevenueBars({ data }: { data: MonthRow[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const currentMonth = data[data.length - 1]?.month;
  const [hover, setHover] = useState<MonthRow | null>(null);
  const shown = hover ?? data[data.length - 1];
  return (
    <div className="relative h-[228px] w-full hud-grid rounded-md" dir="ltr">
      {shown && (
        <div dir="rtl" className="absolute top-1 start-1 z-10 mono text-[11px] text-readout-3 pointer-events-none">
          <span className="text-signal">{shown.label}</span> · <span className="text-readout">{ils(shown.total)}</span> · {shown.count} חשבוניות
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 30, right: 8, bottom: 0, left: 8 }}
          barCategoryGap="30%"
          onMouseMove={(s) => setHover(((s as { activePayload?: { payload: MonthRow }[] })?.activePayload?.[0]?.payload) ?? null)}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="rev-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--signal)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--signal)" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--readout-3)', fontSize: 11, fontFamily: 'inherit' }} reversed />
          <YAxis hide domain={[0, max * 1.15]} />
          <Tooltip
            cursor={{ fill: 'rgba(90,209,255,0.06)', radius: 4 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as MonthRow;
              return (
                <div dir="rtl" className="rounded-md border border-rule-strong bg-chassis-3 px-3 py-2 text-xs shadow-[0_0_0_1px_rgba(90,209,255,.15),0_12px_24px_-12px_rgba(0,0,0,.8)]">
                  <div className="mono text-readout-3">{d.month}</div>
                  <div className="num font-medium text-readout">{ils(d.total)}</div>
                  <div className="text-readout-2 num">{d.count} חשבוניות</div>
                </div>
              );
            }}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive animationDuration={600} animationEasing="ease-out">
            {data.map((d) => (
              <Cell key={d.month} fill="url(#rev-bar)" fillOpacity={d.month === currentMonth ? 1 : 0.5} style={d.month === currentMonth ? { filter: 'drop-shadow(0 0 8px rgba(90,209,255,.45))' } : undefined} />
            ))}
            <LabelList
              dataKey="total"
              position="top"
              formatter={(v) => (typeof v === 'number' && v > 0 ? `₪${Math.round(v).toLocaleString('en-US')}` : '')}
              style={{ fill: 'var(--readout-2)', fontSize: 11, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-plex-mono), monospace' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
