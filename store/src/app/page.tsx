import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts } from '@/lib/catalog';
import { isService } from '@/lib/catalog-filter';
import { featuredOf, flagshipOf, statsOf } from '@/lib/home';
import { Hero } from '@/components/home/hero';
import { Featured } from '@/components/home/featured';
import { CategoryGrid } from '@/components/home/category-grid';
import { ServicesStrip } from '@/components/home/services-strip';
import { TrustStrip } from '@/components/home/trust-strip';

export const metadata: Metadata = { title: { absolute: 'איי.איי אלקטרוניקה — חדר תצוגה' } };

/**
 * Intent: חדר תצוגה — פריט אחד באור, ואחריו הדרך פנימה: המומלצים, הרשת, השירותים, האמון.
 * Hierarchy: hero מלא-רוחב 80dvh → רשת מוצרים → טבלת קטגוריות → פס שירותים → פס אמון שקט.
 * Spacing: פער 64px בין סקשנים במובייל, 96px מ-lg — הרווח הוא מה שמפריד בין הפרקים.
 * בחירת התוכן (דגל/מומלצים/סטטיסטיקות) חיה ב-`lib/home.ts` ונבדקת שם.
 */
export default async function Home() {
  const all = await getProducts();
  const flagship = flagshipOf(all);
  const featured = featuredOf(all, flagship);
  const services = all.filter(isService).sort((a, b) => (a.fields.Price ?? 0) - (b.fields.Price ?? 0));

  return (
    <div className="flex flex-col gap-16 lg:gap-24">
      {flagship ? (
        <>
          <Hero product={flagship} count={all.length} />
          <Featured products={featured} />
        </>
      ) : (
        /* אין חפץ פיזי במלאי: אומרים את זה במשפט אחד ומציעים את הדרך היחידה שנשארה. */
        <section className="py-16 text-center">
          <p className="text-[22px] font-medium text-glow-2">כל המוצרים אזלו כרגע. השירותים עדיין זמינים.</p>
          <Link
            href="/products"
            transitionTypes={['nav-forward']}
            className="mt-4 inline-flex h-11 items-center text-[16px] text-glow-2 transition-colors hover:text-glow"
          >
            לקטלוג המלא ←
          </Link>
        </section>
      )}
      <CategoryGrid stats={statsOf(all)} />
      {services.length > 0 && <ServicesStrip services={services.slice(0, 4)} />}
      <TrustStrip />
    </div>
  );
}
