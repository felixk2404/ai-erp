import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Product } from '@/lib/types';
import { Money } from './money';
import { Tilt } from '@/components/motion/tilt';

/** כרטיס מוצר: תמונה 1:1 כ"מסך" עם ring, מק"ט mono, מחיר mono, LED מלאי. Tilt תלת-ממדי עדין בהובר. */
export function ProductCard({ product, action }: { product: Product; action?: ReactNode }) {
  const f = product.fields;
  return (
    <Tilt max={5} className="h-full">
      <article className="group panel h-full overflow-hidden rounded-lg transition-transform duration-150 ease-out">
        <div className="relative aspect-square bg-chassis-2 overflow-hidden">
          {f.ImageUrl ? (
            <Image
              src={f.ImageUrl}
              alt={f.Name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 260px"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-readout-3 text-xs">אין תמונה</div>
          )}
          <span aria-hidden className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-chassis to-transparent pointer-events-none" />
          {f.Sku && (
            <span className="absolute top-2 start-2 rounded-md bg-void/70 backdrop-blur px-1.5 py-0.5 text-[10px] mono tracking-wider text-signal border border-signal/25" dir="ltr">
              {f.Sku}
            </span>
          )}
        </div>
        <div className="p-3 space-y-1.5">
          <div className="text-[12px] font-medium tracking-wide text-readout-3">{f.Category ?? '—'}</div>
          <h3 className="text-sm font-medium leading-snug text-readout line-clamp-2 min-h-[2.5em]">{f.Name}</h3>
          <div className="flex items-center justify-between pt-1">
            <Money value={f.Price ?? 0} className="font-medium" />
            {action ?? (
              <span className="inline-flex items-center gap-1.5 text-xs text-readout-2">
                <span aria-hidden className={`size-2 rounded-full ${f.InStock ? 'bg-led-green shadow-[0_0_8px_var(--led-green)]' : 'bg-readout-3/50'}`} />
                {f.InStock ? 'במלאי' : 'אין במלאי'}
              </span>
            )}
          </div>
        </div>
      </article>
    </Tilt>
  );
}
