import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRightIcon } from 'lucide-react';
import { DirectionalTransition } from '@/components/motion/page-transition';
import { Stage } from '@/components/product/stage';
import { BuyBox } from '@/components/product/buy-box';
import { Highlights } from '@/components/product/highlights';
import { SpecSheet } from '@/components/product/spec-sheet';
import { EYEBROW } from '@/lib/ui';
import { Related } from '@/components/product/related';
import { Faq } from '@/components/product/faq';
import { getProduct, getProducts, highlights, related } from '@/lib/catalog';

/** התקנה מוצעת רק במה שבאמת מתקינים אצל הלקוח. */
const INSTALL_CATEGORIES = ['מסכים', 'רשת', 'מקלדות'];
const INSTALL_SKU = 'TY-SRV-01';

const bySku = (sku: string) => (p: { fields: { Sku?: string } }) =>
  p.fields.Sku?.toUpperCase() === sku.toUpperCase();

type Props = { params: Promise<{ sku: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sku } = await params;
  const product = await getProduct(sku);
  if (!product) return { title: 'מוצר לא נמצא' };
  return { title: product.fields.Name, description: highlights(product)[0] ?? product.fields.Description };
}

/**
 * Intent: חלון ראווה יחיד — התמונה היא המוקד, וההחלטה נוסעת איתה בעמודה נדבקת.
 * Hierarchy: תמונה → שם+מחיר+פעולה → מפרט → תיאור → פרטים → משלימים → שאלות.
 * Spacing: עמודות 640/420 עם `justify-between` — המרווח ביניהן הוא מספר אחד מוחלט
 * בכל רוחב; 48 בין בלוקי המידע, 64/96 לפני הסקשנים התחתונים.
 * במובייל הסדר הוא תמונה → קופסת קנייה → מידע: המחיר אף פעם לא מתחת לתיאור.
 */
export default async function ProductPage({ params }: Props) {
  const { sku } = await params;
  const all = await getProducts();
  const product = all.find(bySku(sku));
  if (!product) notFound();

  const f = product.fields;
  const installService = INSTALL_CATEGORIES.includes(f.Category ?? '')
    ? all.find(bySku(INSTALL_SKU))
    : undefined;
  const install = installService
    ? { sku: INSTALL_SKU, name: installService.fields.Name, price: installService.fields.Price ?? 0 }
    : null;

  return (
    <DirectionalTransition>
      <nav aria-label="ניווט חזרה" className="flex items-center gap-2 pb-6 text-body text-glow-3">
        <Link
          href="/products"
          transitionTypes={['nav-back']}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-glow"
        >
          <ArrowRightIcon size={14} strokeWidth={2} aria-hidden />
          כל המוצרים
        </Link>
        {f.Category && (
          <>
            <span aria-hidden className="text-glow-4">
              /
            </span>
            <Link
              href={`/products?c=${encodeURIComponent(f.Category)}`}
              transitionTypes={['nav-back']}
              className="transition-colors hover:text-glow"
            >
              {f.Category}
            </Link>
          </>
        )}
      </nav>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,640px)_420px] lg:justify-between">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <Stage product={product} />
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-stretch">
          <BuyBox product={product} install={install} />
        </div>

        <div className="flex min-w-0 flex-col gap-12 lg:col-start-1 lg:row-start-2">
          <Highlights items={highlights(product)} />

          {f.Description && (
            <section>
              <h2 className={EYEBROW}>על המוצר</h2>
              <div className="mt-4 max-w-[68ch] text-lg leading-[1.7] text-glow-2">
                {f.Description.split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <p key={line} className="mt-3 first:mt-0">
                      {line}
                    </p>
                  ))}
              </div>
            </section>
          )}

          <SpecSheet product={product} />
        </div>
      </div>

      <Related products={related(product, all)} />
      <Faq />
    </DirectionalTransition>
  );
}
