'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { ils } from '@/lib/format';
import { ADD_REFUSALS } from '@/lib/ui';
import type { ProductCardData } from '@/lib/catalog-filter';

/** במנוחה הכפתור שקט (panel-2 על rule-strong) והמחיר קריא; ה-beam נשמר למגע ולמוביל. */
const REST =
  'border border-rule-strong bg-panel-2 text-glow hover:border-beam hover:bg-beam hover:text-void dark:hover:bg-beam focus-visible:bg-beam focus-visible:text-void group-hover:border-beam group-hover:bg-beam group-hover:text-void';
const BEAM = 'border border-beam bg-beam text-void hover:bg-beam/85 dark:hover:bg-beam/85';

/** התראות חזרה למלאי לא קיימות בהדגמה — אז לא מבטיחים אותן. הבוט הוא הערוץ האמיתי. */
const NOTIFY_TEXT = 'שאלו את הבוט מתי חוזר. בהדגמה אין התראות חזרה למלאי.';
const NOTIFY_LINK =
  'rounded-md text-start text-meta leading-4 text-glow-3 underline decoration-rule-strong underline-offset-4 transition-colors hover:text-glow hover:decoration-beam';

/**
 * המחיר חי *בתוך* הפעולה — "כמה זה" ו"קח את זה" הן החלטה אחת, וגם כשאזל
 * המספר נשאר על המסך כי זו עדיין המידה להשוואה. את המילה "אזל" אומר התג
 * שלצדו, פעם אחת בלבד.
 * אין טוסט על הוספה מוצלחת: האישור הוא התמונה שעפה, המונה והמגירה (system.md §תנועה).
 * טוסט יש רק כשהעגלה *סירבה* — שם אין שום משוב אחר.
 */
export function PriceButton({
  product,
  compact = false,
  emphasis,
}: {
  product: ProductCardData;
  compact?: boolean;
  emphasis?: 'beam';
}) {
  const { add } = useCart();
  const { sku, name, price, imageUrl, service, inStock } = product;
  const askBot = () => window.dispatchEvent(new CustomEvent('aie:support', { detail: { sku } }));

  if (!inStock) {
    if (compact) {
      return (
        <button type="button" onClick={askBot} title={NOTIFY_TEXT} className={`${NOTIFY_LINK} whitespace-nowrap`}>
          שאלו את הבוט
        </button>
      );
    }
    return (
      <div className="flex w-full flex-col items-center gap-1.5">
        <p className="num flex h-10 w-full items-center justify-center rounded-md border border-rule bg-panel-1 px-4 text-body text-glow-3">
          {ils(price)}
        </p>
        <button type="button" onClick={askBot} className={`${NOTIFY_LINK} text-center text-balance`}>
          {NOTIFY_TEXT}
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={() => {
        const refusal = ADD_REFUSALS[add({ sku, name, price, qty: 1, service, imageUrl })];
        if (refusal) toast(refusal);
      }}
      className={`${emphasis === 'beam' ? BEAM : REST} ${compact ? 'h-8 rounded-md px-3 text-body' : 'h-10 w-full rounded-md px-4 text-body'}`}
    >
      {compact ? (
        'הוסף לסל'
      ) : (
        <>
          הוסף לסל —<span className="num">{ils(price)}</span>
        </>
      )}
    </Button>
  );
}
