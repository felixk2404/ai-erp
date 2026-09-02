import Image from 'next/image';
import Link from 'next/link';
import { PackageIcon } from 'lucide-react';
import { Tilt } from '@/components/motion/tilt';
import { Shared } from '@/components/motion/page-transition';
import { StockBadge } from '@/components/catalog/stock-badge';
import { PriceButton } from '@/components/catalog/price-button';
import { highlights, inStock } from '@/lib/catalog-filter';
import type { Product } from '@/lib/types';

const SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';

/**
 * חפץ בחדר תצוגה: מתחת לסמן הכרטיס מיטה ±6° ומקבל הילת beam, והתמונה עוברת
 * מאפור לצבע — האור "נדלק" על הפריט שמסתכלים עליו.
 * היררכיה: תמונה → שם → שורת מפרט → מלאי + מחיר. הקישור מכסה את כל הכרטיס
 * (`after:inset-0`), וכפתור ההוספה הוא תחנת טאב נפרדת מעליו.
 */
export function ProductCard({ product }: { product: Product }) {
  const f = product.fields;
  const sku = f.Sku ?? product.id;
  const ok = inStock(product);
  const spec = highlights(product)[0];

  return (
    <Tilt className="h-full">
      <article className="group relative flex h-full flex-col overflow-hidden rounded-[12px] border border-rule bg-panel-1 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-rule-strong focus-within:border-rule-strong">
        <div className="relative aspect-4/3 shrink-0 overflow-hidden bg-panel-2">
          <Shared name={`product-image-${sku}`}>
            {f.ImageUrl ? (
              <Image
                src={f.ImageUrl}
                alt={f.Name}
                fill
                sizes={SIZES}
                data-fly-src={sku}
                className="object-cover brightness-90 grayscale transition-[filter,scale] duration-[400ms] ease-out group-hover:scale-[1.03] group-hover:brightness-100 group-hover:grayscale-0 group-focus-within:brightness-100 group-focus-within:grayscale-0"
              />
            ) : (
              <div data-fly-src={sku} className="grid h-full place-items-center text-glow-4">
                <PackageIcon size={28} strokeWidth={1.25} aria-hidden />
              </div>
            )}
          </Shared>
          {!ok && <div aria-hidden className="absolute inset-0 bg-void/45" />}
        </div>

        <div className="flex flex-1 flex-col p-4">
          {f.Category && (
            <p className="font-mono text-[11px] leading-none tracking-[0.08em] text-glow-3">{f.Category}</p>
          )}
          <h3 className="mt-2 line-clamp-2 min-h-[50px] text-[18px] leading-[1.375] font-medium text-glow">
            <Link
              href={`/products/${sku}`}
              transitionTypes={['nav-forward']}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {f.Name}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-1 h-5 text-[14px] leading-5 text-glow-3">{spec}</p>

          <div className="relative z-10 mt-4 flex items-center justify-between gap-3 border-t border-rule pt-4">
            <StockBadge ok={ok} />
            <PriceButton product={product} />
          </div>
        </div>
      </article>
    </Tilt>
  );
}
