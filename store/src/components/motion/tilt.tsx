'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

/**
 * הכרטיס מרגיש כמו חפץ פיזי מתחת לתאורה: הטיה ≤ max מעלות לפי מיקום הסמן,
 * וברק beam שעוקב אחריו. רק transform/opacity — בלי layout, בלי צל.
 *
 * המימוש הוא משתני CSS + transition, ולא motion: הקטלוג מרנדר 34 כרטיסים, וספרינג
 * לכל אחד עלה ~300ms של TBT בטעינה (נמדד ב-Lighthouse) עבור אפקט שקיים רק תחת סמן.
 * כאן ההידרציה היא מאזין אחד לכרטיס, וכיבוי התנועה המופחתת נעשה ב-globals.css —
 * בלי useReducedMotion, ולכן בלי הסתעפות שתלויה בלקוח.
 */
export function Tilt({
  children,
  max = 6,
  glare = true,
  className = '',
}: {
  children: ReactNode;
  max?: number;
  glare?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--tilt-y', `${(px - 0.5) * 2 * max}deg`);
    el.style.setProperty('--tilt-x', `${(0.5 - py) * 2 * max}deg`);
    el.style.setProperty('--glare-x', `${px * 100}%`);
    el.style.setProperty('--glare-y', `${py * 100}%`);
    el.style.setProperty('--glare-o', '1');
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-y', '0deg');
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--glare-o', '0');
  };

  return (
    <div
      ref={ref}
      data-tilt
      onPointerMove={onMove}
      onPointerLeave={reset}
      /* rounded-lg כאן ולא רק על הכרטיס: הברק יורש ממנו את הפינות. */
      className={`relative rounded-lg ${className}`}
    >
      {children}
      {glare && <span aria-hidden data-tilt-glare className="pointer-events-none absolute inset-0 rounded-[inherit]" />}
    </div>
  );
}
