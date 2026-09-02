import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { ProductCard } from '@/components/catalog/product-card';
import type { Product } from '@/lib/types';

/**
 * Intent: אחרי פריט אחד באור — שישה. אותה שפה של הקטלוג, בלי להמציא כרטיס שני לחנות.
 * Hierarchy: תווית מונו → כותרת 28 → משפט עריכה אחד → רשת. הקישור "כל המוצרים" הוא היציאה.
 * Palette: glow לכותרת, glow-2 למשפט, glow-3 לתווית. אין beam — הוא כבר נוצל ב-hero ובכרטיסים.
 * Depth: מגיע מהכרטיסים עצמם (rule + tilt). הסקשן עצמו שטוח בכוונה.
 * Typography: תווית מונו 11, h2 28 Heebo 800, משפט 16.
 * Spacing: כותרת → רשת 32px, פער כרטיסים 16, חשיפה בגלילה בהפרש 60ms.
 */
export function Featured({ products }: { products: Product[] }) {
  return (
    <section aria-labelledby="featured-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.08em] text-glow-3">המומלצים</p>
          <h2 id="featured-title" className="mt-2 text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em]">
            שישה מוצרים שאנחנו מוכרים הכי הרבה השבוע
          </h2>
        </div>
        <Link
          href="/products"
          transitionTypes={['nav-forward']}
          className="flex h-10 items-center text-[14px] text-glow-2 transition-colors hover:text-glow"
        >
          כל המוצרים ←
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.06}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
