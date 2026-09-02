import type { Metadata } from 'next';
import { getProducts, categories, inStock, isService } from '@/lib/catalog';
import { Hero } from '@/components/home/hero';
import { Featured } from '@/components/home/featured';
import { CategoryGrid, type CategoryStat } from '@/components/home/category-grid';
import { ServicesStrip } from '@/components/home/services-strip';
import { TrustStrip } from '@/components/home/trust-strip';
import type { Product } from '@/lib/types';

export const metadata: Metadata = { title: { absolute: 'איי.איי אלקטרוניקה — חדר תצוגה' } };

const price = (p: Product) => p.fields.Price ?? 0;

/** מוצר הדגל: הפריט הפיזי היקר ביותר שאפשר לקנות עכשיו. שירות לא עומד בזרקור — הוא לא חפץ. */
const flagshipOf = (all: Product[]) =>
  all.filter((p) => !isService(p) && inStock(p)).sort((a, b) => price(b) - price(a))[0];

/** שישה מומלצים, אחד לכל קטגוריה קודם — כדי שהרשת תראה את רוחב החנות ולא שלוש גרסאות של אותו דבר. */
function featuredOf(all: Product[], exclude: Product | undefined): Product[] {
  const pool = all.filter((p) => !isService(p) && inStock(p) && p.id !== exclude?.id);
  const byPrice = [...pool].sort((a, b) => price(b) - price(a));
  const seen = new Set<string>();
  const first = byPrice.filter((p) => {
    const c = p.fields.Category ?? '';
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });
  return [...first, ...byPrice.filter((p) => !first.includes(p))].slice(0, 6);
}

function statsOf(all: Product[]): CategoryStat[] {
  return categories(all).map((name) => {
    const items = all.filter((p) => p.fields.Category === name);
    return { name, count: items.length, from: Math.min(...items.map(price)) };
  });
}

/**
 * Intent: חדר תצוגה — פריט אחד באור, ואחריו הדרך פנימה: המומלצים, הרשת, השירותים, האמון.
 * Hierarchy: hero מלא-רוחב 80dvh → רשת מוצרים → טבלת קטגוריות → פס שירותים → פס אמון שקט.
 * Spacing: פער 64px בין סקשנים במובייל, 96px מ-lg — הרווח הוא מה שמפריד בין הפרקים.
 */
export default async function Home() {
  const all = await getProducts();
  const flagship = flagshipOf(all);
  const services = all.filter(isService).sort((a, b) => price(a) - price(b));

  return (
    <div className="flex flex-col gap-16 lg:gap-24">
      {flagship && <Hero product={flagship} count={all.length} />}
      <Featured products={featuredOf(all, flagship)} />
      <CategoryGrid stats={statsOf(all)} />
      {services.length > 0 && <ServicesStrip services={services.slice(0, 4)} />}
      <TrustStrip />
    </div>
  );
}
