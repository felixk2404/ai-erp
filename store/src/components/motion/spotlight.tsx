'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useMotionTemplate, useSpring } from 'motion/react';

const TRACK = { stiffness: 190, damping: 26, mass: 0.6 };

/**
 * זרקור חדר תצוגה: הילת beam ברדיוס 320px שעוקבת אחרי הסמן עם spring,
 * כך שהאור "נגרר" אחרי היד במקום להיצמד אליה.
 *
 * תנועה מופחתת מטופלת ב-globals.css (`[data-spotlight-glow]` תחת
 * prefers-reduced-motion) ולא כאן: useReducedMotion מחזיר null בשרת, ולכן כל
 * הסתעפות מבנית לפיו שוברת הידרציה. אותו DOM בשני המצבים — ה-media query מחליט.
 */
export function Spotlight({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // ספרינגים עצמאיים: set = יעד. (jump לא מודיע ל-useMotionTemplate, אז לא בשימוש.)
  const x = useSpring(0, TRACK);
  const y = useSpring(0, TRACK);
  const opacity = useSpring(0, { stiffness: 120, damping: 30 });
  const beam = useMotionTemplate`radial-gradient(320px circle at ${x}px ${y}px, var(--color-beam-soft), transparent 70%)`;

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const r = ref.current!.getBoundingClientRect();
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
    opacity.set(1);
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={() => opacity.set(0)} className={`relative isolate ${className}`}>
      <motion.div
        data-spotlight-glow
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: beam, opacity }}
      />
      {children}
    </div>
  );
}
