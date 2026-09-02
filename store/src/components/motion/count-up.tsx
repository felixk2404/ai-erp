'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { ils } from '@/lib/format';

const int = (n: number) => String(Math.round(n));

/**
 * מספר שנספר לערך ב-600ms (ease-out) — הסכום *משתנה* מול העין במקום להתחלף
 * בפתאומיות. מעדכן textContent ישירות, בלי setState לכל פריים.
 * SSR מרנדר כבר את הערך הסופי, כך שאין קפיצת פריסה ולא שובר קורא מסך.
 */
export function CountUp({ value, money = false, className = '' }: { value: number; money?: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = money ? ils : int;
  const from = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controls = animate(from.current, value, {
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    from.current = value;
    return () => controls.stop();
  }, [value, format]);

  return (
    <span ref={ref} className={`num ${className}`}>
      {format(value)}
    </span>
  );
}
