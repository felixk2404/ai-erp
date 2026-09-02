'use client';

import Link from 'next/link';
import { RotateCwIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EYEBROW } from '@/lib/ui';

/**
 * תקלה בצד השרת. אותה טיפוגרפיה של ה-404 — משפט אחד ופעולה אחת ברורה (ניסיון חוזר),
 * כי מסך שגיאה שמסביר לעצמו הוא מסך שמבקש מהלקוח לפתור אותו.
 * `digest` מוצג ב-.num קטן: מזהה לתמיכה, לא הודעה.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50dvh] flex-col items-start justify-center gap-4">
      <p className={EYEBROW}>שגיאה</p>
      <h1 className="text-3xl leading-[1.15] font-extrabold tracking-[-0.02em] sm:text-display">משהו נשבר כאן</h1>
      <p className="max-w-[48ch] text-glow-2">התקלה אצלנו, לא אצלכם. אפשר לנסות שוב.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={reset} className={buttonVariants({ className: 'h-11 gap-1.5 rounded-md px-4 text-body' })}>
          <RotateCwIcon size={14} strokeWidth={2} aria-hidden />
          נסו שוב
        </button>
        <Link
          href="/products"
          transitionTypes={['nav-back']}
          className="flex h-11 items-center rounded-md px-4 text-body text-glow-2 transition-colors hover:text-glow"
        >
          לכל המוצרים
        </Link>
      </div>
      {error.digest && (
        <p dir="ltr" className="num text-meta text-glow-3">
          {error.digest}
        </p>
      )}
    </div>
  );
}
