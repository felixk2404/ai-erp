import { ProductCard } from '@/components/catalog/product-card';
import { Reveal } from '@/components/motion/reveal';
import { toCard } from '@/lib/catalog-filter';
import type { Product } from '@/lib/types';

/**
 * Intent: "מה עוד צריך כדי שזה יעבוד" — לא קרוסלת המלצות. שלושה פריטים, סוף.
 * Hierarchy: כותרת 22/800 מעל שורה אחת של כרטיסים; אותו כרטיס בדיוק כמו בקטלוג,
 * כדי שהעין לא תלמד שפה שנייה.
 */
export function Related({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16 lg:mt-24">
      <h2 className="text-[22px] leading-tight font-extrabold tracking-[-0.02em]">משלימים</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.06} className="h-full">
            <ProductCard product={toCard(p)} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
