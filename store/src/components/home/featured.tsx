import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { ProductCard } from '@/components/catalog/product-card';
import { gridPlan, pickLead, toCard } from '@/lib/catalog-filter';
import type { Product } from '@/lib/types';
import { EYEBROW } from '@/lib/ui';

/**
 * Intent: אחרי פריט אחד באור — עוד שבעה, ואחד מהם גדול. אותה שפה של הקטלוג
 * *כולל חוק המוביל*: רשת של כרטיסים זהים היא קיר, לא חלון ראווה — כאן הראשון
 * רחב כפול, השני בסדר גודל, וכך העין יודעת איפה להתחיל.
 * הצילומים על רקע בהיר, ולכן הרשת מוחשכת ב-`[&_img]` בעמוד הזה בלבד — אחרת שבע תמונות
 * בהירות גוברות על ה-hero. ב-hover *הכרטיס שנוגעים בו* מחזיר צבע ובהירות מלאים ב-300ms:
 * הסלקטור מכוון ל-`.group:hover` של הכרטיס ולא ל-hover של הרשת, אחרת כולן היו נדלקות יחד.
 * Hierarchy: תווית 11 → כותרת 28 → כרטיס מוביל → שאר הרשת. הקישור "כל המוצרים" הוא היציאה.
 * Palette: glow לכותרת, glow-3 לתווית. ה-beam היחיד הוא כפתור המוביל — כמו בקטלוג.
 * Depth: מגיע מהכרטיסים עצמם (rule + tilt). הסקשן עצמו שטוח בכוונה.
 * Typography: תווית היבו 11, h2 28 Heebo 800.
 * Spacing: כותרת → רשת 32px, פער כרטיסים 16, חשיפה בהפרש 60ms.
 * `priority={false}` על המוביל: מועמד ה-LCP של דף הבית הוא תמונת ה-hero, ושתי
 * תמונות בעדיפות גבוהה מתחרות עליה ברוחב הפס.
 */
export function Featured({ products }: { products: Product[] }) {
  const cards = products.map(toCard);
  const plan = gridPlan(cards.length);
  const lead = plan.lead ? pickLead(cards) : null;
  const ordered = lead ? [lead, ...cards.filter((x) => x !== lead)] : cards;

  return (
    <section aria-labelledby="featured-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={EYEBROW}>המומלצים</p>
          <h2 id="featured-title" className="mt-2 text-3xl leading-[1.15] font-extrabold tracking-[-0.02em]">
            שווה מבט
          </h2>
        </div>
        <Link
          href="/products"
          transitionTypes={['nav-forward']}
          className="flex h-10 items-center text-body text-glow-2 transition-colors hover:text-glow"
        >
          כל המוצרים ←
        </Link>
      </div>

      <div
        className={`mt-8 grid gap-4 [&_img]:saturate-[.6] [&_img]:brightness-[.65] [&_img]:transition-[filter] [&_img]:duration-300 [&_.group:hover_img]:saturate-100 [&_.group:hover_img]:brightness-100 ${plan.columns}`}
      >
        {ordered.map((p, i) => {
          const isLead = plan.lead && i === 0;
          return (
            <Reveal key={p.id} delay={i * 0.06} className={`h-full ${isLead ? 'lg:col-span-2' : ''}`}>
              <ProductCard product={p} variant={isLead ? 'lead' : 'default'} priority={false} />
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
