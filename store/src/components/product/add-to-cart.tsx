'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Quantity } from '@/components/cart/quantity';
import { useCart } from '@/components/cart/cart-provider';
import { ils } from '@/lib/format';

/** השירות המשלים שהעמוד מציע (TY-SRV-01) — כבר מסונן בשרת, ולכן פשוט. */
export type InstallOffer = { sku: string; name: string; price: number };

type Props = {
  sku: string;
  name: string;
  price: number;
  service: boolean;
  imageUrl?: string;
  ok: boolean;
  install: InstallOffer | null;
};

/**
 * Intent: החלטה אחת — כמה, ובכמה. הכמות והמחיר יושבים באותה שורה עם הכפתור
 * כדי שלא צריך להסתכל למעלה כדי לדעת מה משלמים.
 * Hierarchy: הכפתור הראשי הוא נקודת ה-beam היחידה בקופסה; ההתקנה מתחתיו ב-ghost.
 * a11y: אזור חי אחד בלבד — זה שבתוך בורר הכמות. הכפלת ההודעה (גם הכמות וגם
 * הסכום) מקריאה פעמיים את אותו שינוי, ולכן הסכום בכפתור נשאר טקסט רגיל.
 *
 * אין טוסט על הוספה לסל: האישור הוא הטיסה לעגלה, המונה בכותרת והמגירה שנפתחת.
 * אזל מלאי — המחיר עדיין מוצג (זו עדיין החלטת קנייה), והפעולה היחידה היא הרשמה.
 */
export function AddToCart({ sku, name, price, service, imageUrl, ok, install }: Props) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (!ok) {
    return (
      <div className="flex flex-col gap-2">
        <p className="num flex h-11 items-center justify-center rounded-sm border border-rule bg-panel-2 text-[14px] text-glow-3">
          {ils(price)}
        </p>
        <Button
          variant="link"
          onClick={() => toast('נרשמת, נודיע כשיחזור למלאי')}
          className="h-auto justify-center px-0 text-[14px] text-glow-2 underline decoration-rule-strong underline-offset-4 hover:text-glow hover:decoration-beam"
        >
          הודיעו לי
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Quantity value={qty} onChange={setQty} />
        <Button
          onClick={() => add({ sku, name, price, qty, service, imageUrl })}
          className="h-11 flex-1 gap-1.5 rounded-sm px-4 text-[14px]"
        >
          הוסף לסל —<span className="num">{ils(price * qty)}</span>
        </Button>
      </div>

      {install && (
        <Button
          variant="ghost"
          // ponytail: לשירות אין תמונה על העמוד הזה, ולכן FlyToCart (מחפש [data-fly-src="SKU"])
          // נופל למגירה בלבד — הפידבק הנכון ממילא, כי אין חפץ שיעוף.
          onClick={() => add({ sku: install.sku, name: install.name, price: install.price, qty: 1, service: true })}
          className="h-11 w-full justify-between rounded-sm px-4 text-[14px] text-glow-2 hover:text-glow"
        >
          הזמן התקנה
          <span className="num text-glow-3">{ils(install.price)}</span>
        </Button>
      )}
    </div>
  );
}

/**
 * שאלה על המוצר בלי לעזוב את העמוד: הווידג'ט (משימה 11) מאזין ל-aie:support
 * ופותח את עצמו עם שאלה מוכנה על המק"ט הזה.
 */
export function AskBotLink({ sku }: { sku: string }) {
  return (
    <Button
      variant="link"
      onClick={() => window.dispatchEvent(new CustomEvent('aie:support', { detail: { sku } }))}
      className="h-auto justify-start px-0 text-[14px] text-glow-2 underline decoration-rule-strong underline-offset-4 hover:text-glow hover:decoration-beam"
    >
      שאל את הבוט על המוצר
    </Button>
  );
}
