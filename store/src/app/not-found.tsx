import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EYEBROW } from '@/lib/ui';

/**
 * כתובת שלא קיימת. אותה קומפוזיציה בדיוק כמו ה-404 של המוצר (משפט אחד, בלי איור,
 * בלי התנצלות) — כדי שהמבוי הסתום ירגיש כמו חדר בבניין ולא כמו אתר אחר.
 * היררכיה: eyebrow 404 → כותרת → שורת הסבר → פעולה ראשית (קטלוג) ומשנית (בית).
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[50dvh] flex-col items-start justify-center gap-4">
      <p className={`num ${EYEBROW}`}>404</p>
      <h1 className="text-3xl leading-[1.15] font-extrabold tracking-[-0.02em] sm:text-display">הדף לא נמצא</h1>
      <p className="max-w-[48ch] text-glow-2">הקישור שהגעתם ממנו כנראה כבר לא קיים. הקטלוג במקום.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Link
          href="/products"
          transitionTypes={['nav-back']}
          className={buttonVariants({ className: 'h-11 gap-1.5 rounded-md px-4 text-body' })}
        >
          <ArrowRightIcon size={14} strokeWidth={2} aria-hidden />
          לקטלוג
        </Link>
        <Link
          href="/"
          transitionTypes={['nav-back']}
          className="flex h-11 items-center rounded-md px-4 text-body text-glow-2 transition-colors hover:text-glow"
        >
          לדף הבית
        </Link>
      </div>
    </div>
  );
}
