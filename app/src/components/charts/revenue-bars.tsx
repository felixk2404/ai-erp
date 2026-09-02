'use client';

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthRow } from '@/lib/insights';
import { ils } from '@/lib/format';

/**
 * הכנסות לפי חודש — סדרה אחת, גוון יחיד (inkblue), עמודות דקות עם קצה מעוגל 4px,
 * ערכים ישירים מעל העמודות (≤ 6 חודשים), ציר y מוסתר, tooltip עם ₪. (dataviz: no dual axis, thin marks)
 */
export function RevenueBars({ data }: { data: MonthRow[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const currentMonth = data[data.length - 1]?.month;
  return (
    <div className="h-[220px] w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 8 }} barCategoryGap="28%">
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'inherit' }} reversed />
          <YAxis hide domain={[0, max * 1.15]} />
          <Tooltip
            cursor={{ fill: 'var(--paper-3)', radius: 4 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as MonthRow;
              return (
                <div dir="rtl" className="rounded-md border border-rule bg-paper-2 px-3 py-2 text-xs shadow-[0_0_0_1px_var(--rule),0_4px_12px_-6px_rgba(31,35,38,.25)]">
                  <div className="text-ink-3">{d.month}</div>
                  <div className="num font-medium text-ink">{ils(d.total)}</div>
                  <div className="text-ink-2 num">{d.count} חשבוניות</div>
                </div>
              );
            }}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive animationDuration={500} animationEasing="ease-out">
            {data.map((d) => (
              <Cell key={d.month} fill="var(--inkblue)" fillOpacity={d.month === currentMonth ? 1 : 0.55} />
            ))}
            <LabelList
              dataKey="total"
              position="top"
              formatter={(v) => (typeof v === 'number' && v > 0 ? `₪${Math.round(v).toLocaleString('en-US')}` : '')}
              style={{ fill: 'var(--ink-2)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
