import type { Metadata } from 'next';
import { Catalog } from '@/components/catalog/catalog';
import { EYEBROW } from '@/lib/ui';
import { categories, getProducts } from '@/lib/catalog';
import { parseCatalogParams, toCard } from '@/lib/catalog-filter';

export const metadata: Metadata = {
  title: 'מוצרים',
  description: 'הקטלוג המלא — מק״ט, מפרט, מלאי ומחיר בשורה אחת.',
};

/**
 * הכותרת נשארת קטנה בכוונה: הפוקוס של העמוד הוא הרשת עצמה.
 * הסינון קורה בלקוח (34 פריטים), אבל ה-URL נטען בשרת כדי שלינק מסונן ייפתח מסונן.
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, products] = await Promise.all([searchParams, getProducts()]);

  return (
    <>
      <div className="pb-6">
        <p className={EYEBROW}>קטלוג</p>
        <h1 className="mt-2 text-[28px] leading-[1.05] font-extrabold tracking-[-0.02em] sm:text-[44px]">מוצרים</h1>
        <p className="mt-2 max-w-md text-[14px] text-glow-3">
          כל מה שבחנות. מק״ט, מפרט, מלאי ומחיר — באותה שורה.
        </p>
      </div>
      <Catalog products={products.map(toCard)} categories={categories(products)} initial={parseCatalogParams(params)} />
    </>
  );
}
