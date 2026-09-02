'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { inStock, isService } from '@/lib/catalog-filter';
import { ils } from '@/lib/format';
import type { Product } from '@/lib/types';

/**
 * הפעולה היחידה בכרטיס, ולכן נקודת ה-beam היחידה בו: המחיר יושב *בתוך* הכפתור
 * כדי ש"כמה זה עולה" ו"קח את זה" יהיו החלטה אחת ולא שתיים.
 * אזל מלאי → אותה מסגרת בדיוק, בלי צבע: "הודיעו לי".
 */
export function PriceButton({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { add } = useCart();
  const f = product.fields;
  const sku = f.Sku ?? product.id;
  const price = f.Price ?? 0;
  const ok = inStock(product);
  const size = compact ? 'h-8 rounded-[8px] px-3 text-[13px]' : 'h-10 w-full rounded-[8px] px-4 text-[14px]';

  if (!ok) {
    return (
      <Button variant="outline" onClick={() => toast('נרשמת, נודיע כשיחזור למלאי')} className={size}>
        הודיעו לי
      </Button>
    );
  }

  return (
    <Button
      onClick={() => {
        add({ sku, name: f.Name, price, qty: 1, service: isService(product), imageUrl: f.ImageUrl });
        toast.success('נוסף לסל');
      }}
      className={size}
    >
      {compact ? (
        'הוסף'
      ) : (
        <>
          הוסף לסל —<span className="num">{ils(price)}</span>
        </>
      )}
    </Button>
  );
}
