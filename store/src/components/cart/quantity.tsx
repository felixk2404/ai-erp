'use client';

import { AnimatePresence, motion } from 'motion/react';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAX_QTY } from '@/lib/cart';

const MotionButton = motion.create(Button);

/** ספרינג "לחצן": חוזר מהר, בלי נדנוד — משוב, לא הצגה. */
const SPRING = { type: 'spring' as const, stiffness: 400, damping: 17 };

/**
 * בורר כמות: −/מספר/+ בתוך מסגרת אחת, כדי שהשלושה ייקראו כפקד יחיד.
 * המספר לא מתחלף בפתאומיות — הוא מתגלגל למעלה/למטה, ככה שהעין רואה *שינוי*.
 * ההודעה לקורא מסך נשארת אצל האזור החי, לא אצל הכפתורים.
 */
export function Quantity({
  value,
  onChange,
  max = MAX_QTY,
  min = 1,
}: {
  value: number;
  onChange: (qty: number) => void;
  max?: number;
  min?: number;
}) {
  return (
    <div className="flex items-center rounded-sm border border-rule bg-panel-2 p-0.5">
      <MotionButton
        variant="ghost"
        size="icon"
        aria-label="הפחת כמות"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={SPRING}
        className="size-8 rounded-sm text-glow-2 hover:bg-panel-3 hover:text-glow disabled:text-glow-4"
      >
        <MinusIcon size={14} strokeWidth={2} aria-hidden />
      </MotionButton>

      <div className="relative h-8 w-9 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="num absolute inset-0 grid place-items-center text-sm font-medium text-glow"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>

      <MotionButton
        variant="ghost"
        size="icon"
        aria-label="הוסף כמות"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={SPRING}
        className="size-8 rounded-sm text-glow-2 hover:bg-panel-3 hover:text-glow disabled:text-glow-4"
      >
        <PlusIcon size={14} strokeWidth={2} aria-hidden />
      </MotionButton>

      <span aria-live="polite" className="sr-only">{`כמות: ${value}`}</span>
    </div>
  );
}
