'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion, useMotionTemplate } from 'motion/react';

const SPRING = { stiffness: 300, damping: 22, mass: 0.5 };

/**
 * הכרטיס מרגיש כמו חפץ פיזי מתחת לתאורה: הטיה ≤ max מעלות לפי מיקום הסמן,
 * וברק beam שעוקב אחרי הסמן. במגע ובתנועה מופחתת פשוט לא נרשמים מאזינים,
 * והכרטיס נשאר בזווית 0 עם ברק שקוף — אותו DOM, כדי שההידרציה תתאים.
 * רק transform/opacity — בלי layout, בלי צל.
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
  const reduced = useReducedMotion();
  const rx = useSpring(0, SPRING);
  const ry = useSpring(0, SPRING);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const go = useSpring(0, { stiffness: 200, damping: 30 });
  const glareBg = useMotionTemplate`radial-gradient(180px circle at ${gx}% ${gy}%, var(--color-beam-soft), transparent 70%)`;

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const r = ref.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 2 * max);
    rx.set((0.5 - py) * 2 * max);
    gx.set(px * 100);
    gy.set(py * 100);
    go.set(1);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
    go.set(0);
  };

  return (
    <div
      ref={ref}
      onPointerMove={reduced ? undefined : onMove}
      onPointerLeave={reduced ? undefined : reset}
      className={`[perspective:800px] ${className}`}
    >
      {/* rounded-lg על העוטף עצמו: הברק יורש ממנו (`rounded-[inherit]`), ובלי זה
          פינות ההילה יוצאות מרובעות מעל כרטיס מעוגל. */}
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }} className="relative h-full rounded-lg">
        {children}
        {glare && (
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glareBg, opacity: go }} />
        )}
      </motion.div>
    </div>
  );
}
