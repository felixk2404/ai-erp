/**
 * חתימת המותג — טיפוגרפית בלבד (אין קובץ לוגו): "איי.איי" ב-Heebo 800 מלא,
 * "אלקטרוניקה" מוחלש רמה אחת, ולפניהם נקודת beam בתוך הילה רכה — מקור האור
 * שממנו כל שאר החנות מוארת. אין צל; העומק הוא ההילה.
 */
export function Wordmark({ size = 18 }: { size?: 18 | 22 }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="grid size-4 shrink-0 place-items-center rounded-full bg-beam-soft">
        <span className="size-1.5 rounded-full bg-beam" />
      </span>
      <span
        className={`font-extrabold tracking-[-0.02em] whitespace-nowrap ${size === 22 ? 'text-[22px]' : 'text-[18px]'}`}
      >
        <span className="text-glow">איי.איי</span> <span className="text-glow-2">אלקטרוניקה</span>
      </span>
    </span>
  );
}
