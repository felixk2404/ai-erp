'use client';

import { motion, stagger, useReducedMotion } from 'motion/react';

const line = { hidden: {}, visible: { transition: { delayChildren: stagger(0.05) } } };

/**
 * מצב הפתיחה משותף לשני המצבים בכוונה: זה מה שהשרת מרנדר, ו-useReducedMotion
 * מחזיר null בשרת — כל הסתעפות כאן הייתה הידרציה שבורה. מה שמשתנה הוא היעד
 * והמעבר, שנקבעים רק בצד הלקוח.
 */
const HIDDEN = { opacity: 0, y: 12, filter: 'blur(6px)' };

const word = {
  hidden: HIDDEN,
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, bounce: 0.2, visualDuration: 0.4 } },
};

/** תנועה מופחתת: אותה הכרזה בדהייה בלבד — ה-y וה-blur מתאפסים מיד, בלי תנועה. */
const wordCalm = {
  hidden: HIDDEN,
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { opacity: { duration: 0.25, ease: 'easeOut' as const }, y: { duration: 0 }, filter: { duration: 0 } },
  },
};

/**
 * כותרת שנכנסת מילה-מילה (stagger 50ms) — הכרזה, לא קישוט. משמשת פעם אחת בעמוד.
 * הטקסט המלא נשאר לקורא מסך דרך aria-label; המילים עצמן aria-hidden.
 */
export function WordReveal({ text, className = '' }: { text: string; className?: string }) {
  const variants = useReducedMotion() ? wordCalm : word;
  return (
    <motion.span variants={line} initial="hidden" animate="visible" aria-label={text} className={`inline-block ${className}`}>
      {text.split(' ').map((w, i) => (
        <motion.span key={`${w}-${i}`} variants={variants} aria-hidden className="me-[0.25em] inline-block">
          {w}
        </motion.span>
      ))}
    </motion.span>
  );
}
