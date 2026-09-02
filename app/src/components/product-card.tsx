import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Product } from '@/lib/types';
import { Money } from './money';

/** כרטיס מוצר: תמונה 1:1 על נייר, שם 14/500, מק"ט mono, מחיר tabular, LED מלאי. */
export function ProductCard({ product, action }: { product: Product; action?: ReactNode }) {
  const f = product.fields;
  return (
    <article className="group bg-paper-2 border border-rule rounded-lg overflow-hidden transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--rule-strong),0_6px_16px_-8px_rgba(31,35,38,.25)]">
      <div className="relative aspect-square bg-paper-3">
        {f.ImageUrl ? (
          <Image
            src={f.ImageUrl}
            alt={f.Name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 260px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-ink-3 text-xs">אין תמונה</div>
        )}
        {f.Sku && (
          <span className="absolute top-2 start-2 rounded-md bg-paper-2/90 backdrop-blur px-1.5 py-0.5 text-[11px] font-mono text-ink-2 border border-rule" dir="ltr">
            {f.Sku}
          </span>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <div className="text-[11px] font-medium tracking-wide text-ink-3">{f.Category ?? '—'}</div>
        <h3 className="text-sm font-medium leading-snug text-ink line-clamp-2 min-h-[2.5em]">{f.Name}</h3>
        <div className="flex items-center justify-between pt-1">
          <Money value={f.Price ?? 0} className="font-medium" />
          {action ?? (
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
              <span aria-hidden className={`size-2 rounded-full ${f.InStock ? 'bg-led-green shadow-[0_0_6px_var(--led-green)]' : 'bg-ink-3/40'}`} />
              {f.InStock ? 'במלאי' : 'אין במלאי'}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
