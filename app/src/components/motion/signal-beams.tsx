'use client';

import { useEffect, useRef } from 'react';

type Grid = { rows: number; cols: number };

const RGB = [90, 209, 255] as const;
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * "קו האות": canvas שקוף שמצייר קרן ציאן רכה שנעה לאורך קווי ההפרדה של רשת.
 * מבוסס על הרעיון של GridBeam (cult-ui) — גוון יחיד, נשימה עדינה, בלי תלות.
 * הרשת נבחרת לפי רוחב (נייד = 2×2). מכבד prefers-reduced-motion (לא מצייר).
 */
export function SignalBeams({ desktop, mobile = { rows: 2, cols: 2 }, breakpoint = 768, duration = 4.2, strength = 1, className = '' }: { desktop: Grid; mobile?: Grid; breakpoint?: number; duration?: number; strength?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    let w = 0;
    let h = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const start = performance.now();
    let raf = 0;
    const rgba = (a: number) => `rgba(${RGB[0]},${RGB[1]},${RGB[2]},${Math.max(0, a).toFixed(3)})`;

    const beam = (x1: number, y1: number, x2: number, y2: number, len: number, op: number) => {
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, 'transparent');
      g.addColorStop(0.35, rgba(op * 0.5));
      g.addColorStop(0.5, `rgba(200,240,255,${(op).toFixed(3)})`);
      g.addColorStop(0.65, rgba(op * 0.5));
      g.addColorStop(1, 'transparent');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // bloom
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const b = ctx.createRadialGradient(cx, cy, 0, cx, cy, len * 0.5);
      b.addColorStop(0, rgba(op * 0.22));
      b.addColorStop(1, 'transparent');
      ctx.fillStyle = b;
      ctx.beginPath();
      ctx.arc(cx, cy, len * 0.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden) return;
      ctx.clearRect(0, 0, w, h);
      if (!w || !h) return;
      const { rows, cols } = w < breakpoint ? mobile : desktop;
      const el = (now - start) / 1000;
      const fade = smooth(Math.min(1, el / 1.2)) * strength;
      const br = 0.85 + 0.25 * Math.sin(el * 1.1);
      const cw = w / cols;
      const ch = h / rows;
      // אנכיים: לאורך המפרידים בין תאים
      for (let c = 1; c < cols; c++) {
        const x = c * cw;
        const t = ((el * (1 + (c % 3) * 0.1)) / (duration * 1.15) + c * 0.31) % 1;
        const y = t * h;
        const len = ch * 0.75 * br;
        beam(x, y - len / 2, x, y + len / 2, len, 0.85 * fade);
      }
      // אופקיים: גבולות הרשת (עליון/פנימי)
      for (let r = 0; r < rows; r++) {
        const y = r === 0 ? 0.5 : r * ch;
        const t = ((el * (1 + (r % 2) * 0.12)) / duration + r * 0.4 + 0.15) % 1;
        const x = (1 - t) * w; // RTL: מימין לשמאל
        const len = cw * 0.7 * br;
        beam(x - len / 2, y, x + len / 2, y, len, (r === 0 ? 0.55 : 0.75) * fade);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [desktop, mobile, breakpoint, duration, strength]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
