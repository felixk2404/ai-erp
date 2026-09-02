import Link from 'next/link';
import { ils } from '@/lib/format';

export type CategoryStat = { name: string; count: number; from: number };

const ROW = 'grid grid-cols-[1fr_56px_112px_16px] items-center gap-3 px-3';

/**
 * Intent: החתימה של החנות — הקטלוג כגיליון מפרט. העין סורקת עמודה אחת במקום 13 תיבות.
 * Hierarchy: הכותרת יושבת *לצד* הטבלה ולא מעליה, כדי שהסקשן לא יהיה עוד בלוק מלא-רוחב;
 *   בתוך הטבלה כל השורות שוות במשקל וההבדל היחיד הוא הנתון — וזאת הנקודה.
 * Palette: טקסט בלבד. hover מדליק panel-1 מתחת לשורה ומצית את החץ ב-beam — האור עובר עם הסמן.
 * Depth: קווי rule בין שורות, קו rule-strong מתחת לכותרות. אין רקע, אין מסגרת, אין צל.
 * Typography: שמות בהיבו 14, מספרים ומחירים במונו .num עם tabular-nums כדי שהעמודות לא ירקדו.
 * Spacing: שורה 44px (יעד מגע), פער 64px בין הכותרת לטבלה בדסקטופ.
 */
export function CategoryGrid({ stats }: { stats: CategoryStat[] }) {
  return (
    <section
      aria-labelledby="categories-title"
      className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16"
    >
      <div className="lg:pt-2">
        <p className="font-mono text-[11px] tracking-[0.08em] text-glow-3">רשת המפרט</p>
        <h2 id="categories-title" className="mt-2 text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em]">
          כל הקטלוג, בשורה אחת לכל קטגוריה
        </h2>
        <p className="mt-3 max-w-[36ch] text-[16px] text-glow-2">
          אותה רשת חוזרת בקטלוג, בעמוד המוצר ובתשובות של הבוט.
        </p>
      </div>

      <div>
        <div
          aria-hidden
          className={`${ROW} border-b border-rule-strong pb-2 font-mono text-[11px] tracking-[0.08em] text-glow-3`}
        >
          <span>קטגוריה</span>
          <span className="text-end">פריטים</span>
          <span className="text-end">החל מ-</span>
          <span />
        </div>
        {stats.map((s) => (
          <Link
            key={s.name}
            href={`/products?c=${encodeURIComponent(s.name)}`}
            transitionTypes={['nav-forward']}
            className={`${ROW} group h-11 border-b border-rule transition-colors hover:bg-panel-1`}
          >
            <span className="truncate text-[14px] text-glow-2 transition-colors group-hover:text-glow">{s.name}</span>
            <span className="num text-end text-[13px] text-glow-3">{s.count}</span>
            <span className="num text-end text-[13px] text-glow-2">{ils(s.from)}</span>
            <span aria-hidden className="text-[13px] text-glow-4 transition-colors group-hover:text-beam">
              ←
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
