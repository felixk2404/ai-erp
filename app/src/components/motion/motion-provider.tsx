'use client';

import { MotionConfig } from 'motion/react';

/** מכבד prefers-reduced-motion: משאיר opacity/color, מבטל תזוזות. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
