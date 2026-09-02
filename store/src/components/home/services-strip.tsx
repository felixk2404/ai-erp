import Link from 'next/link';
import { PriceButton } from '@/components/catalog/price-button';
import { ils } from '@/lib/format';
import { SERVICE } from '@/lib/catalog-filter';
import type { Product } from '@/lib/types';

/**
 * Intent: להזכיר שהחנות מוכרת גם עבודה, לא רק קופסאות — ושאפשר להזמין אותה באותה לחיצה.
 * Hierarchy: תווית מונו → כותרת 22 → ארבעה פריטים שווים; המחיר יושב בתוך הכפתור, כמו בכל החנות.
 * Palette: פס panel-1 יחיד שמפריד אותו מהרקע. ה-beam היחיד הוא כפתורי ההזמנה.
 * Depth: משטח אחד מוגבה בגבול rule — לא ארבעה כרטיסים נפרדים; זה פס, לא רשת.
 * Typography: שם השירות 16/500, מחיר מונו .num 14, תווית 11.
 * Spacing: ריפוד 24 (32 מ-md), פער 16 בין הפריטים, מפרידי rule אנכיים בדסקטופ.
 */
export function ServicesStrip({ services }: { services: Product[] }) {
  return (
    <section aria-labelledby="services-title" className="rounded-lg border border-rule bg-panel-1 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.08em] text-glow-3">שירותים</p>
          <h2 id="services-title" className="mt-2 text-[22px] leading-[1.2] font-extrabold tracking-[-0.02em]">
            טכנאי בבית הלקוח, או תמיכה מרחוק
          </h2>
        </div>
        <Link
          href={`/products?c=${encodeURIComponent(SERVICE)}`}
          transitionTypes={['nav-forward']}
          className="flex h-10 items-center text-[14px] text-glow-2 transition-colors hover:text-glow"
        >
          כל השירותים ←
        </Link>
      </div>

      <ul className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 border-t border-rule pt-4 lg:border-t-0 lg:border-s lg:border-rule lg:pt-0 lg:ps-6 lg:first:border-s-0 lg:first:ps-0"
          >
            <div className="min-w-0">
              <Link
                href={`/products/${s.fields.Sku ?? s.id}`}
                transitionTypes={['nav-forward']}
                className="line-clamp-2 text-[16px] leading-[1.3] font-medium text-glow underline-offset-4 hover:underline"
              >
                {s.fields.Name}
              </Link>
              <p className="num mt-1 text-[14px] text-glow-3">{ils(s.fields.Price ?? 0)}</p>
            </div>
            <PriceButton product={s} compact />
          </li>
        ))}
      </ul>
    </section>
  );
}
