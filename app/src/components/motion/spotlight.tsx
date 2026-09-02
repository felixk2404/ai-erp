'use client';

import { useEffect } from 'react';

/**
 * מאזין pointermove יחיד לכל הדף: מעדכן --mx/--my על ה-.panel שתחת הסמן,
 * וה-CSS מצייר זוהר ציאן על הגבול (ראו .panel ב-globals.css). בלי JS לכל כרטיס.
 */
export function SpotlightProvider() {
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    let last: HTMLElement | null = null;
    let raf = 0;
    let ev: PointerEvent | null = null;
    const apply = () => {
      raf = 0;
      if (!ev) return;
      const el = (ev.target as Element | null)?.closest?.('.panel') as HTMLElement | null;
      if (last && last !== el) {
        last.style.removeProperty('--mx');
        last.style.removeProperty('--my');
      }
      last = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${ev.clientX - r.left}px`);
      el.style.setProperty('--my', `${ev.clientY - r.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      ev = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
