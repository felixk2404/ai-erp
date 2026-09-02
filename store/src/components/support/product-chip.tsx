'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { PackageIcon } from 'lucide-react';
import { useCart } from '@/components/cart/cart-provider';
import { ils } from '@/lib/format';
import type { SupportProduct } from '@/app/support/actions';

/**
 * כרטיס מוצר שהסוכן הזכיר בתשובה. שורת בקרה צפופה: תמונה 48, שם, מחיר ומצב מלאי,
 * וכפתור אחד — הפעולה היחידה שיש כאן. המלאי הוא "במלאי"/"אזל" בלבד, לעולם לא מספר.
 */
export function ProductChip({ product }: { product: SupportProduct }) {
  const { add } = useCart();

  return (
    <div className="flex items-center gap-3 rounded-md border border-rule bg-panel-2 p-2">
      <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-sm bg-panel-1">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill sizes="48px" className="object-cover" />
        ) : (
          <PackageIcon size={18} strokeWidth={1.5} className="text-glow-4" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-tight text-glow">{product.name}</p>
        <p className="mt-1 flex items-center gap-2 text-[11px] leading-none">
          <span className="num text-glow-2">{ils(product.price)}</span>
          <span className={product.inStock ? 'text-ok' : 'text-glow-3'}>{product.inStock ? 'במלאי' : 'אזל'}</span>
        </p>
      </div>

      <button
        type="button"
        disabled={!product.inStock}
        onClick={() => {
          add({ sku: product.sku, name: product.name, price: product.price, qty: 1, service: product.service, imageUrl: product.imageUrl });
          toast.success('נוסף לסל', { description: product.name });
        }}
        className="h-10 shrink-0 rounded-md border border-rule-strong bg-panel-3 px-3 text-sm font-medium text-glow transition-colors hover:border-beam/50 hover:text-beam disabled:pointer-events-none disabled:text-glow-4"
      >
        הוסף לסל
      </button>
    </div>
  );
}
