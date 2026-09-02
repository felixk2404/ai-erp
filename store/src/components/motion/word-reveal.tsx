'use client';

import { motion, stagger } from 'motion/react';

const line = { hidden: {}, visible: { transition: { delayChildren: stagger(0.05) } } };
const word = {
  hidden: { opacity: 0, y: 12, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, bounce: 0.2, visualDuration: 0.4 } },
};

/**
 * כותרת שנכנסת מילה-מילה (stagger 50ms) — הכרזה, לא קישוט. משמשת פעם אחת בעמוד.
 * הטקסט המלא נשאר לקורא מסך דרך aria-label; המילים עצמן aria-hidden.
 */
export function WordReveal({ text, className = '' }: { text: string; className?: string }) {
  return (
    <motion.span variants={line} initial="hidden" animate="visible" aria-label={text} className={`inline-block ${className}`}>
      {text.split(' ').map((w, i) => (
        <motion.span key={`${w}-${i}`} variants={word} aria-hidden className="me-[0.25em] inline-block">
          {w}
        </motion.span>
      ))}
    </motion.span>
  );
}
