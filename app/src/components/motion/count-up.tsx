'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { ils } from '@/lib/format';

const FORMATS = { ils, int: (n: number) => String(Math.round(n)) } as const;

/** מספר גיבור שנספר מ-0 לערך ב-600ms (ease-out). מעדכן DOM ישירות — בלי setState. */
export function CountUp({ value, kind = 'ils', className = '' }: { value: number; kind?: keyof typeof FORMATS; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = FORMATS[kind];
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controls = animate(0, value, {
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [value, format]);
  return (
    <span ref={ref} className={`num ${className}`}>
      {format(value)}
    </span>
  );
}
