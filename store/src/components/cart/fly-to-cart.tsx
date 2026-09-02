'use client';

import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { useCart } from '@/components/cart/cart-provider';
import { createArcPath } from '@/lib/arc';

const DURATION = 0.45;
const EASE = [0.74, 0.18, 0.93, 0.69] as const;
const SIZE = 64;
const OPEN_AFTER = 400;

/** קצב הסיום של המסלול (px/שנייה) — משמש כמהירות התחלתית ל"בעיטה" של האייקון. */
function endVelocity(path: (t: number) => { x: number; y: number }) {
  const dt = 0.02;
  const a = path(1 - dt);
  const b = path(1);
  return { vx: (b.x - a.x) / (dt * DURATION), vy: (b.y - a.y) / (dt * DURATION) };
}

/**
 * "הפריט נכנס לעגלה" — הסיבתיות היחידה שיש לנו במקום טוסט: העתק של התמונה
 * עף בקשת אל אייקון העגלה, האייקון סופג את המכה (ספרינג עם המהירות שירש
 * מהטיסה) וטבעת beam יוצאת ממנו. רק אז המגירה נפתחת.
 * בתנועה מופחתת — רק פתיחת המגירה. ההעתק לעולם לא חוסם עכבר.
 */
export function FlyToCart() {
  const { lastAdded, setOpen } = useCart();
  const reduced = useReducedMotion();
  const seen = useRef(0);

  useEffect(() => {
    if (!lastAdded || lastAdded.at === seen.current) return;
    seen.current = lastAdded.at;

    const target = document.querySelector<HTMLElement>('[data-cart-target]');
    const source = document.querySelector<HTMLElement>(`[data-fly-src="${CSS.escape(lastAdded.sku)}"]`);
    const openNow = () => setOpen(true);

    if (reduced || !target || !source) {
      openNow();
      return;
    }

    const a = source.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const path = createArcPath(
      { x: a.left + a.width / 2, y: a.top + a.height / 2 },
      { x: b.left + b.width / 2, y: b.top + b.height / 2 }
    );
    const baseAngle = path(0).rotate;

    const ghost = ((source instanceof HTMLImageElement ? source : source.querySelector('img')) ?? source).cloneNode(true) as HTMLElement;
    ghost.removeAttribute('data-fly-src');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.cssText = `position:fixed;inset-block-start:0;inset-inline-start:0;left:0;top:0;margin:0;width:${SIZE}px;height:${SIZE}px;max-width:none;object-fit:cover;border-radius:8px;border:1px solid var(--color-rule-strong);background:var(--color-panel-2);pointer-events:none;z-index:100;will-change:transform,opacity`;
    document.body.appendChild(ghost);

    const flight = animate(0, 1, {
      duration: DURATION,
      ease: [...EASE],
      onUpdate: (p) => {
        const s = path(p);
        const scale = 1 + (0.25 - 1) * p;
        ghost.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%) rotate(${(s.rotate - baseAngle) * 0.4}deg) scale(${scale})`;
        ghost.style.opacity = p < 0.95 ? '1' : String(1 - (p - 0.95) / 0.05);
      },
    });

    const ring = document.createElement('span');
    let ringMounted = false;

    void flight.finished
      .then(() => {
        ghost.remove();

        // האייקון סופג את הפגיעה בכיוון שממנו הגיע הפריט וחוזר בספרינג.
        // הזזה מפורשת (ולא 0→0) כי מנוע התנועה מדלג על אנימציה לערך זהה.
        const { vx, vy } = endVelocity(path);
        const len = Math.hypot(vx, vy) || 1;
        const push = Math.min(7, len * 0.004);
        animate(
          target,
          // שתי מסגרות בלבד — ספרינג לא תומך ביותר, וההחזרה שלו היא ה"קפיצה".
          { x: [(vx / len) * push, 0], y: [(vy / len) * push, 0], scale: [1.18, 1] },
          { type: 'spring', stiffness: 500, damping: 12, x: { velocity: vx * 0.05 }, y: { velocity: vy * 0.05 } }
        );

        ring.setAttribute('aria-hidden', 'true');
        ring.style.cssText = `position:fixed;left:${b.left + b.width / 2}px;top:${b.top + b.height / 2}px;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:9999px;border:1px solid var(--color-beam);pointer-events:none;z-index:99`;
        document.body.appendChild(ring);
        ringMounted = true;
        void animate(ring, { scale: [1, 2.2], opacity: [0.8, 0] }, { duration: 0.5, ease: 'easeOut' }).finished.then(() => ring.remove());
      })
      .catch(() => ghost.remove());

    const timer = window.setTimeout(openNow, OPEN_AFTER);

    return () => {
      window.clearTimeout(timer);
      flight.stop();
      ghost.remove();
      if (ringMounted) ring.remove();
    };
  }, [lastAdded, reduced, setOpen]);

  return null;
}
