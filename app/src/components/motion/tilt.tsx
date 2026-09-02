'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion, useMotionTemplate } from 'motion/react';

/**
 * Tilt תלת-ממדי עדין: ≤ max מעלות לפי מיקום הסמן, spring, ברק ציאן שעוקב אחרי הסמן.
 * כבוי במגע ובתנועה מופחתת. רק transform/opacity.
 */
export function Tilt({ children, max = 6, className = '', glare = true }: { children: ReactNode; max?: number; className?: string; glare?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const rx = useSpring(useMotionValue(0), { stiffness: 260, damping: 24, mass: 0.5 });
  const ry = useSpring(useMotionValue(0), { stiffness: 260, damping: 24, mass: 0.5 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const go = useSpring(useMotionValue(0), { stiffness: 200, damping: 30 });
  const glareBg = useMotionTemplate`radial-gradient(180px circle at ${gx}% ${gy}%, rgba(var(--signal-rgb) / 0.16), transparent 70%)`;

  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType === 'touch') return;
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
    <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={className} style={{ perspective: 800 }}>
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }} className="relative h-full">
        {children}
        {glare && <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glareBg, opacity: go }} />}
      </motion.div>
    </div>
  );
}
