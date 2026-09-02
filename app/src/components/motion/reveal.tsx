import * as motion from 'motion/react-client';

const EASE = [0.23, 1, 0.32, 1] as const;

/** כניסה עדינה (8px + fade) עם דיליי לפי אינדקס — לפאנלים בדשבורד. Server-safe (motion/react-client). */
export function Reveal({ children, index = 0, className }: { children: React.ReactNode; index?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE, delay: Math.min(index, 8) * 0.05 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
