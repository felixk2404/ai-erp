'use client';

import { motion } from 'motion/react';
import { FREE_SHIPPING_FROM } from '@/lib/cart';
import { ils } from '@/lib/format';

/**
 * "עוד X למשלוח חינם" — הפער בשקלים למעלה, ההתקדמות מתחתיו.
 * הפס ממלא מקצה ההתחלה (ימין ב-RTL) בספרינג, כדי שהוספת פריט תיראה כדחיפה
 * קדימה ולא כקפיצה. מגיע ל-ok כשהיעד הושג — זה סטטוס, לא אקסנט.
 */
export function FreeShippingBar({ gap, subtotal }: { gap: number; subtotal: number }) {
  const reached = gap <= 0;
  const progress = Math.min(1, Math.max(0, subtotal / FREE_SHIPPING_FROM));

  return (
    <div>
      <p className={`text-sm ${reached ? 'text-ok' : 'text-glow-2'}`}>
        {reached ? (
          'משלוח חינם'
        ) : (
          <>
            עוד <span className="num text-glow">{ils(gap)}</span> למשלוח חינם
          </>
        )}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-panel-3">
        <motion.div
          aria-hidden
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ type: 'spring', bounce: 0.2, visualDuration: 0.4 }}
          className={`h-full w-full origin-right rounded-full ${reached ? 'bg-ok' : 'bg-beam'}`}
        />
      </div>
    </div>
  );
}
