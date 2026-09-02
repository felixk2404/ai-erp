'use client';

import { useEffect, useState } from 'react';

/**
 * טקסט "מוזרם": נחשף מילה-מילה עם cursor ציאן, כמו תשובת סוכן.
 * reduced-motion → מוצג מיד. שומר שורות (\n).
 */
export function StreamText({ text, wordMs = 34, startDelay = 120, className = '' }: { text: string; wordMs?: number; startDelay?: number; className?: string }) {
  const words = text.split(/(\s+)/); // שומר רווחים/שורות כטוקנים
  const [n, setN] = useState(() => (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? words.length : 0));
  const done = n >= words.length;

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setN((k) => k + 2), n === 0 ? startDelay : wordMs);
    return () => clearTimeout(t);
  }, [n, done, wordMs, startDelay]);

  return (
    <span className={`whitespace-pre-wrap ${done ? '' : 'cursor-blink'} ${className}`} aria-label={text}>
      {words.slice(0, n).join('')}
    </span>
  );
}
