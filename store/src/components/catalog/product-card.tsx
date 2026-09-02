import Image from 'next/image';
import Link from 'next/link';
import { PackageIcon } from 'lucide-react';
import { Tilt } from '@/components/motion/tilt';
import { Shared } from '@/components/motion/page-transition';
import { StockBadge } from '@/components/catalog/stock-badge';
import { PriceButton } from '@/components/catalog/price-button';
import { EYEBROW } from '@/lib/ui';
import type { ProductCardData } from '@/lib/catalog-filter';

const SIZES = '(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw';

/**
 * חפץ בחדר תצוגה: במנוחה המוצר בצבע מלא — האפור שמור לכניסה בגלילה בלבד
 * (`Reveal` מריץ grayscale(1)→0), כי אפור קבוע הופך את העמוד למת.
 * תחת הסמן הכרטיס מיטה ±6°, מקבל הילת beam ומתרומם 2px.
 * היררכיה: תמונה → שם → שורת מפרט → מלאי + מחיר. הקישור מכסה את כל הכרטיס
 * (`after:inset-0`), וכפתור ההוספה הוא תחנת טאב נפרדת מעליו.
 * `variant="lead"` הוא הפריט המוביל של הרשת — רחב כפול, שם 22, שתי שורות
 * מפרט וכפתור beam — נקודת המבט היחידה במסך; השאר מודמם בכוונה.
 * התמונה שלו ב-object-contain על במת panel-2 עם מסגרת inset-6, כי חיתוך cover
 * קוצץ מוצר; בכרטיס רגיל cover נותן מלבן נקי. ב-lg הוא מתפצל לרוחב (תמונה
 * בחצי אחד, טקסט בשני) — כרטיס אנכי ברוחב כפול יוצא גבוה מדי ומפיל את הכפתור
 * מתחת לקפל ב-1366×800.
 * הקלט הוא `ProductCardData` ולא `Product`: הכרטיס חוצה גבול שרת→לקוח, וכמות
 * המלאי אסור לה לנסוע ב-RSC payload.
 */
export function ProductCard({
  product,
  variant = 'default',
  priority,
}: {
  product: ProductCardData;
  variant?: 'default' | 'lead';
  /** ברירת מחדל: המוביל בלבד. דף הבית מכבה — ה-hero הוא מועמד ה-LCP שלו. */
  priority?: boolean;
}) {
  const { sku, name, category, imageUrl, inStock: ok } = product;
  const lead = variant === 'lead';
  const specs = product.highlights.slice(0, lead ? 2 : 1);

  return (
    <Tilt className="h-full">
      <article
        className={`group relative flex h-full flex-col overflow-hidden rounded-lg border border-rule bg-panel-1 transition-[border-color,translate] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-rule-strong focus-within:border-rule-strong ${lead ? 'lg:flex-row' : ''}`}
      >
        <div
          className={`relative shrink-0 overflow-hidden bg-panel-2 ${lead ? 'aspect-3/2 lg:aspect-auto lg:w-1/2' : 'aspect-3/2 sm:aspect-4/3'}`}
        >
          <Shared name={`product-image-${sku}`}>
            {imageUrl ? (
              // `fill` מתעלם מ-padding, ולכן הבמה של המוביל היא מעטפת inset-6 —
              // מסגרת שווה בארבעת הצדדים סביב מוצר שמוצג במלואו.
              <div className={`absolute ${lead ? 'inset-6' : 'inset-0'}`}>
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  sizes={SIZES}
                  priority={priority ?? lead}
                  data-fly-src={sku}
                  className={lead ? 'object-contain' : 'object-cover'}
                />
              </div>
            ) : (
              <div data-fly-src={sku} className="grid h-full place-items-center text-glow-4">
                <PackageIcon size={lead ? 40 : 28} strokeWidth={1.25} aria-hidden />
              </div>
            )}
          </Shared>
          {!ok && <div aria-hidden className="absolute inset-0 bg-void/45" />}
        </div>

        <div className={`flex flex-1 flex-col p-4 ${lead ? 'lg:justify-center' : ''}`}>
          {category && <p className={EYEBROW}>{category}</p>}
          <h3
            className={`mt-2 line-clamp-2 font-medium text-glow ${lead ? 'text-2xl leading-[1.3]' : 'text-xl leading-[1.375]'}`}
          >
            <Link
              href={`/products/${sku}`}
              transitionTypes={['nav-forward']}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {name}
            </Link>
          </h3>
          {specs.map((s) => (
            <p key={s} className="mt-1 line-clamp-1 text-body leading-5 text-glow-3">
              {s}
            </p>
          ))}

          <div
            className={`relative z-10 mt-auto flex items-center justify-between gap-3 border-t border-rule pt-4 ${lead ? 'lg:mt-6' : ''}`}
          >
            <StockBadge ok={ok} />
            <PriceButton product={product} emphasis={lead ? 'beam' : undefined} />
          </div>
        </div>
      </article>
    </Tilt>
  );
}
