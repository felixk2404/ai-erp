'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { inStock, isService } from '@/lib/catalog-filter';
import { ils } from '@/lib/format';
import type { Product } from '@/lib/types';

/** במנוחה הכפתור שקט (panel-2 על rule-strong) והמחיר קריא; ה-beam נשמר למגע ולמוביל. */
const REST =
  'border border-rule-strong bg-panel-2 text-glow hover:border-beam hover:bg-beam hover:text-void dark:hover:bg-beam focus-visible:bg-beam focus-visible:text-void group-hover:border-beam group-hover:bg-beam group-hover:text-void';
const BEAM = 'border border-beam bg-beam text-void hover:bg-beam/85 dark:hover:bg-beam/85';

/**
 * המחיר חי *בתוך* הפעולה — "כמה זה" ו"קח את זה" הן החלטה אחת, וגם כשאזל
 * המספר נשאר על המסך ("אזל — 349.00 ₪") כי זו עדיין המידה להשוואה.
 * אין טוסט על הוספה: האישור הוא התמונה שעפה, המונה והמגירה (system.md §תנועה).
 */
export function PriceButton({
  product,
  compact = false,
  emphasis,
}: {
  product: Product;
  compact?: boolean;
  emphasis?: 'beam';
}) {
  const { add } = useCart();
  const f = product.fields;
  const price = f.Price ?? 0;
  const ok = inStock(product);
  const notify = () => toast('נרשמת, נודיע כשיחזור למלאי');

  if (!ok) {
    if (compact) {
      return (
        <button
          type="button"
          onClick={notify}
          className="rounded-md text-[14px] text-glow-3 underline underline-offset-4 transition-colors hover:text-glow"
        >
          הודיעו לי
        </button>
      );
    }
    return (
      <div className="flex w-full flex-col items-center gap-1.5">
        <p className="flex h-10 w-full items-center justify-center gap-1.5 rounded-md border border-rule bg-panel-1 px-4 text-[14px] text-glow-3">
          אזל —<span className="num">{ils(price)}</span>
        </p>
        <button
          type="button"
          onClick={notify}
          className="rounded-md text-[14px] text-glow-3 underline underline-offset-4 transition-colors hover:text-glow"
        >
          הודיעו לי
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={() => add({ sku: f.Sku ?? product.id, name: f.Name, price, qty: 1, service: isService(product), imageUrl: f.ImageUrl })}
      className={`${emphasis === 'beam' ? BEAM : REST} ${compact ? 'h-8 rounded-md px-3 text-[14px]' : 'h-10 w-full rounded-md px-4 text-[14px]'}`}
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
