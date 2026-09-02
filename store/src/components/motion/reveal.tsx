import * as motion from 'motion/react-client';

/**
 * "נדלק" בגלילה: המוצר נכנס מלמטה ומקבל צבע (grayscale→color) —
 * כמו תאורת חדר תצוגה שנדלקת על הפריט הבא. פעם אחת בלבד, בלי לולאה.
 * Server-safe (motion/react-client); MotionConfig reducedMotion="user" מבטל את ה-y.
 */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'grayscale(1)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'grayscale(0)' }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ type: 'spring', bounce: 0.2, visualDuration: 0.35, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
