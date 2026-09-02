import Image from 'next/image';
import Link from 'next/link';
import { PackageIcon } from 'lucide-react';
import { Spotlight } from '@/components/motion/spotlight';
import { WordReveal } from '@/components/motion/word-reveal';
import { Shared } from '@/components/motion/page-transition';
import { StockBadge } from '@/components/catalog/stock-badge';
import { AskBot } from '@/components/home/ask-bot';
import { buttonVariants } from '@/components/ui/button';
import { inStock } from '@/lib/catalog-filter';
import { ils } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { EYEBROW } from '@/lib/ui';

/** מונו רק על הספרות; היחידה והמילים העבריות נשארות בהיבו (החלטה כלל-אתרית). */
const FACTS = [
  { label: 'משלוח', value: '29', unit: '₪' },
  { label: 'חינם מעל', value: '300', unit: '₪' },
  { label: 'החזרה', value: '14', unit: 'יום' },
] as const;

/**
 * Intent: חדר תצוגה חשוך שבו פריט אחד עומד באור. הכותרת מסבירה את האור, לא מתחרה בו.
 * Hierarchy: מוצר הדגל (דיסקה מוארת, 500px) → כותרת → CTA ראשי → שורת עובדות. כל השאר מודמם.
 *   במובייל המוצר ראשון (`order-1`); ב-lg הוא בעמודה השנייה ושורת העובדות משתרעת על שתיהן.
 * Palette: void מלא רוחב, panel-2 לדיסקה, beam רק בכפתור אחד ובהילה הרכה מסביב לדיסקה.
 * Depth: קווי rule + הילה רדיאלית + טבעת מקווקוות מסתובבת. אין צל אחד בכל הסקשן.
 * Typography: eyebrow היבו 11 (מונו רק על המספר), h1 Heebo 800 בטווח 44→96, משנה 18/1.5 glow-2,
 *   שורת העובדות היבו 14 עם ספרות במונו.
 * Spacing: מלא-רוחב עם תוכן מיושר ל-1280, min-h 80dvh, פער 40px בין שורות הרשת.
 * Motion: הכניסה (`data-enter`) והריחוף (`data-hero-float`) הם CSS ב-globals.css ולא motion —
 *   ה-hero הוא מועמד ה-LCP של הדף, ואנימציה שמתחילה רק אחרי הידרציה השאירה אותו ריק
 *   ~7 שניות במכשיר איטי. כך הוא גם רץ בלי שורת JS אחת ומכבד prefers-reduced-motion נטיבית.
 */
export function Hero({ product, count }: { product: Product; count: number }) {
  const f = product.fields;
  const sku = f.Sku ?? product.id;

  return (
    <Spotlight className="-mt-8 mx-[calc(50%-50vw)] border-b border-rule px-[max(20px,calc(50vw-640px))] pt-12 pb-16 lg:pt-16 lg:pb-24">
      <div
        className="grid min-h-[80dvh] content-center items-center gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:grid-rows-[auto_auto]"
      >
        <div className="order-2 flex flex-col items-start lg:order-none lg:col-start-1 lg:row-start-1">
          <p data-enter="2" className={EYEBROW}>
            חדר תצוגה · <span className="num">{count}</span> מוצרים · אחריות יבואן
          </p>

          {/* 9ch = "טכנולוגיה" ועוד ~9% אוויר: ה-ch של היבו צר מהאות העברית הממוצעת, אז זה כופה
              שבירה אחרי המילה הראשונה בלי לחתוך אותה. בלי זה הכותרת נשארת שורה אחת ונשפכת מהעמודה. */}
          <h1 className="mt-5 max-w-[9ch] text-[clamp(44px,6vw,96px)] leading-[0.95] font-extrabold tracking-[-0.02em] text-balance">
            <WordReveal text="טכנולוגיה שרואים." />
          </h1>

          <p data-enter="3" className="mt-5 max-w-[42ch] text-xl leading-[1.5] text-glow-2">
            מוצרים מקוריים. שירות AI. משלוח עד הבית.
          </p>

          <div data-enter="4" className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              transitionTypes={['nav-forward']}
              className={cn(buttonVariants(), 'h-12 rounded-md px-6 text-lg')}
            >
              לקטלוג
            </Link>
            <AskBot className={cn(buttonVariants({ variant: 'outline' }), 'h-12 rounded-md px-6 text-lg')}>
              שאל את הבוט
            </AskBot>
          </div>
        </div>

        {/* המוצר ראשון במובייל (`order-1`): בחדר תצוגה מסתכלים על החפץ, לא קוראים שלט. */}
        <div
          data-enter="1"
          className="relative order-1 mx-auto w-full max-w-[340px] sm:max-w-[380px] lg:order-none lg:col-start-2 lg:row-start-1 lg:max-w-[500px]"
        >
          {/* קישור אחד על כל הדיסקה: מסתכלים על הפריט, לוחצים על הפריט. כרטיס המפרט הוא התווית שלו. */}
          <Link
            href={`/products/${sku}`}
            transitionTypes={['nav-forward']}
            className="group relative block aspect-square"
          >
            {/* overflow-clip כאן ולא על הקישור: תיבת הגבול של הטבעת המסתובבת היא ריבוע מסובב (×1.41),
                ובלעדיו היא מרחיבה את גלילת הדף במובייל — אבל כרטיס המפרט חייב להישאר *מחוץ* לקליפ. */}
            <div className="absolute inset-0 overflow-clip rounded-full">
              {/* הטבעת המקווקוות: סיבוב איטי שמסמן "פריט בתצוגה". CSS ולא JS, כדי ש-prefers-reduced-motion יכבה אותו בוודאות. */}
              <div
                aria-hidden
                className="absolute inset-[4%] animate-[spin_20s_linear_infinite] rounded-full border border-dashed border-rule-strong motion-reduce:animate-none"
              />
              <div
                aria-hidden
                className="absolute inset-0 rounded-full [background:radial-gradient(closest-side,var(--color-beam-soft),transparent)]"
              />

              {/* הדיסקה צפה 6 שניות — הפריט "מרחף" בתוך האור. CSS, כדי שהריחוף לא
                  יחכה להידרציה ו-prefers-reduced-motion יכבה אותו נטיבית. */}
              <div
                data-hero-float
                className="absolute inset-[10%] overflow-hidden rounded-full border border-rule bg-panel-2"
              >
                <Shared name={`product-image-${sku}`}>
                  {f.ImageUrl ? (
                    <Image
                      src={f.ImageUrl}
                      alt={f.Name}
                      fill
                      priority
                      sizes="(max-width: 1024px) 80vw, 400px"
                      data-fly-src={sku}
                      className="object-cover [filter:saturate(0.18)_brightness(0.88)_contrast(1.08)] [mask-image:radial-gradient(closest-side,#000_42%,transparent_94%)]"
                    />
                  ) : (
                    <div data-fly-src={sku} className="grid h-full place-items-center text-glow-4">
                      <PackageIcon size={40} strokeWidth={1} aria-hidden />
                    </div>
                  )}
                </Shared>
              </div>
            </div>

            <span className="absolute bottom-[2%] start-0 z-10 block w-[192px] sm:w-[208px] lg:start-[-5%] rounded-md border border-rule bg-panel-2/90 p-3 backdrop-blur-sm transition-colors group-hover:border-rule-strong">
              <span dir="ltr" className="num block text-meta tracking-[0.06em] text-glow-3">
                {sku}
              </span>
              <span className="mt-1 line-clamp-2 text-body leading-[1.3] font-medium text-glow">{f.Name}</span>
              <span className="mt-2 flex items-center justify-between gap-2 border-t border-rule pt-2">
                <StockBadge ok={inStock(product)} />
                <span className="num text-body text-glow">{ils(f.Price ?? 0)}</span>
              </span>
            </span>
          </Link>
        </div>

        <dl
          data-enter="5"
          className="order-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule pt-6 text-body tracking-[0.08em] text-glow-3 lg:col-span-2 lg:col-start-1 lg:row-start-2"
        >
          {FACTS.map((fact, i) => (
            <div key={fact.label} className="flex items-center gap-2">
              <dt>{fact.label}</dt>
              <dd className="text-glow-2">
                <span className="num">{fact.value}</span> {fact.unit}
              </dd>
              {/* מפריד *עוקב* ולא מוביל: בשבירת שורה הנקודה נשארת בסוף השורה ולא פותחת אותה. */}
              {i < FACTS.length - 1 && (
                <span aria-hidden className="text-glow-4">
                  ·
                </span>
              )}
            </div>
          ))}
        </dl>
      </div>
    </Spotlight>
  );
}
