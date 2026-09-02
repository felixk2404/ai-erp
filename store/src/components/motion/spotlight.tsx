'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

const TRACK = { stiffness: 190, damping: 26, mass: 0.6 };

/**
 * זרקור חדר תצוגה: הילת beam ברדיוס 320px שעוקבת אחרי הסמן עם spring,
 * כך שהאור "נגרר" אחרי היד במקום להיצמד אליה. בתנועה מופחתת — הילה סטטית במרכז.
 * מצייר רק background (composited), בלי צל ובלי layout.
 */
export function Spotlight({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useSpring(useMotionValue(0), TRACK);
  const y = useSpring(useMotionValue(0), TRACK);
  const opacity = useSpring(useMotionValue(0), { stiffness: 120, damping: 30 });
  const beam = useMotionTemplate`radial-gradient(320px circle at ${x}px ${y}px, var(--color-beam-soft), transparent 70%)`;

  if (reduced) {
    return (
      <div className={`relative isolate ${className}`}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(320px_circle_at_50%_50%,var(--color-beam-soft),transparent_70%)]"
        />
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`relative isolate ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType === 'touch') return;
        const r = ref.current!.getBoundingClientRect();
        // כניסה ראשונה: קופצים למקום כדי שהאור לא יטוס מהפינה.
        const place = opacity.get() === 0 ? ('jump' as const) : ('set' as const);
        x[place](e.clientX - r.left);
        y[place](e.clientY - r.top);
        opacity.set(1);
      }}
      onPointerLeave={() => opacity.set(0)}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: beam, opacity }} />
      {children}
    </div>
  );
}
