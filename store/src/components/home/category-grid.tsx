import Link from 'next/link';
import { ils } from '@/lib/format';
import type { CategoryStat } from '@/lib/home';
import { EYEBROW } from '@/lib/ui';

const ROW = 'grid grid-cols-[minmax(0,260px)_56px_112px_16px] items-center gap-3 px-3';

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
  const total = stats.reduce((n, s) => n + s.count, 0);
  // Math.min() על מערך ריק מחזיר Infinity — קטלוג ריק היה מדפיס "החל מ-∞ ₪".
  const from = stats.length > 0 ? Math.min(...stats.map((s) => s.from)) : 0;

  return (
    <section aria-labelledby="categories-title" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
      <div className="lg:self-center">
        <p className={EYEBROW}>קטגוריות</p>
        <h2 id="categories-title" className="mt-2 text-3xl leading-[1.15] font-extrabold tracking-[-0.02em]">
          מה מחפשים היום?
        </h2>
        <p className="mt-3 max-w-[36ch] text-lg text-glow-2">
          כל מחיר כולל מע״מ, וכשכתוב במלאי זה באמת במלאי.
        </p>
        {/* הסכומים ממלאים את החלל בעמודת הכותרת ונותנים את גודל החנות במשפט אחד.
            בלי tracking: ריווח אותיות רחב על עברית קורא כמו מונו. .num רק על הספרות. */}
        {stats.length > 0 && (
          <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-glow-3">
            <span className="num">{stats.length}</span> קטגוריות
            <span aria-hidden className="text-glow-4">
              ·
            </span>
            <span className="num">{total}</span> מוצרים
            <span aria-hidden className="text-glow-4">
              ·
            </span>
            החל מ־<span className="num">{ils(from)}</span>
          </p>
        )}
      </div>

      <div>
        <div
          aria-hidden
          className={`${ROW} border-b border-rule-strong pb-2 ${EYEBROW}`}
        >
          <span>קטגוריה</span>
          <span className="text-end">מוצרים</span>
          <span className="text-end">החל מ־</span>
          <span />
        </div>
        {stats.map((s) => (
          <Link
            key={s.name}
            href={`/products?c=${encodeURIComponent(s.name)}`}
            transitionTypes={['nav-forward']}
            aria-label={`${s.name}, ${s.count === 1 ? 'מוצר אחד' : `${s.count} מוצרים`}, החל מ־${ils(s.from)}`}
            className={`${ROW} group h-11 border-b border-rule transition-colors hover:bg-panel-1`}
          >
            <span aria-hidden className="truncate text-body text-glow-2 transition-colors group-hover:text-glow">
              {s.name}
            </span>
            <span aria-hidden className="num text-end text-body text-glow-3">
              {s.count}
            </span>
            <span aria-hidden className="num text-end text-body text-glow-2">
              {ils(s.from)}
            </span>
            <span aria-hidden className="text-body text-glow-3 transition-colors group-hover:text-beam">
              ←
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
