import Image from 'next/image';
import Link from 'next/link';
import { PackageIcon } from 'lucide-react';
import { Tilt } from '@/components/motion/tilt';
import { Shared } from '@/components/motion/page-transition';
import { StockBadge } from '@/components/catalog/stock-badge';
import { PriceButton } from '@/components/catalog/price-button';
import { highlights, inStock } from '@/lib/catalog-filter';
import type { Product } from '@/lib/types';

const SIZES = '(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw';
const SIZES_LEAD = '(min-width: 1280px) 612px, (min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw';

/**
 * חפץ בחדר תצוגה: במנוחה המוצר בצבע מלא — האפור שמור לכניסה בגלילה בלבד
 * (`Reveal` מריץ grayscale(1)→0), כי אפור קבוע הופך את העמוד למת.
 * תחת הסמן הכרטיס מיטה ±6°, מקבל הילת beam ומתרומם 2px.
 * היררכיה: תמונה → שם → שורת מפרט → מלאי + מחיר. הקישור מכסה את כל הכרטיס
 * (`after:inset-0`), וכפתור ההוספה הוא תחנת טאב נפרדת מעליו.
 * `variant="lead"` הוא הפריט המוביל של הרשת — גדול פי ארבעה, שם 22, שתי שורות
 * מפרט וכפתור beam — נקודת המבט היחידה במסך; השאר מודמם בכוונה.
 * התמונה שלו ב-object-contain על במת panel-2, כי כרטיס 2×2 חותך תצלום ריבועי;
 * בכרטיס רגיל cover נותן מלבן נקי.
 */
export function ProductCard({ product, variant = 'default' }: { product: Product; variant?: 'default' | 'lead' }) {
  const f = product.fields;
  const sku = f.Sku ?? product.id;
  const ok = inStock(product);
  const lead = variant === 'lead';
  const specs = highlights(product).slice(0, lead ? 2 : 1);

  return (
    <Tilt className="h-full">
      <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-rule bg-panel-1 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-rule-strong focus-within:border-rule-strong">
        <div
          className={`relative aspect-3/2 overflow-hidden bg-panel-2 sm:aspect-4/3 ${lead ? 'p-6 lg:aspect-auto lg:max-h-[400px] lg:flex-1' : 'shrink-0'}`}
        >
          <Shared name={`product-image-${sku}`}>
            {f.ImageUrl ? (
              <Image
                src={f.ImageUrl}
                alt={f.Name}
                fill
                sizes={lead ? SIZES_LEAD : SIZES}
                priority={lead}
                data-fly-src={sku}
                className={lead ? 'object-contain' : 'object-cover'}
              />
            ) : (
              <div data-fly-src={sku} className="grid h-full place-items-center text-glow-4">
                <PackageIcon size={lead ? 40 : 28} strokeWidth={1.25} aria-hidden />
              </div>
            )}
          </Shared>
          {!ok && <div aria-hidden className="absolute inset-0 bg-void/45" />}
        </div>

        <div className="flex flex-1 flex-col p-4">
          {f.Category && (
            <p className="text-[11px] leading-none tracking-[0.08em] text-glow-3">{f.Category}</p>
          )}
          <h3
            className={`mt-2 line-clamp-2 font-medium text-glow ${lead ? 'text-[22px] leading-[1.3]' : 'text-[18px] leading-[1.375]'}`}
          >
            <Link
              href={`/products/${sku}`}
              transitionTypes={['nav-forward']}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {f.Name}
            </Link>
          </h3>
          {specs.map((s) => (
            <p key={s} className="mt-1 line-clamp-1 text-[14px] leading-5 text-glow-3">
              {s}
            </p>
          ))}

          <div className="relative z-10 mt-auto flex items-center justify-between gap-3 border-t border-rule pt-4">
            <StockBadge ok={ok} />
            <PriceButton product={product} emphasis={lead ? 'beam' : undefined} />
          </div>
        </div>
      </article>
    </Tilt>
  );
}
