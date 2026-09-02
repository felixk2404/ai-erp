'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/cart-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckoutForm } from '@/components/checkout/checkout-form';

/**
 * Intent: העמוד עצמו כמעט שקוף — כותרת אחת ואז הטופס. אין hero, אין תמונות:
 * בשלב הזה הלקוח כבר החליט, והמסך רק צריך לא להפריע לו לסיים.
 * Hierarchy: h1 28 (לא 44 — זה לא עמוד שיווקי) → הטופס → הסיכום.
 * Spacing: כותרת, 40, תוכן. עמודות 40 ביניהן.
 */
export function CheckoutView() {
  const { cart, ready } = useCart();
  const router = useRouter();
  const [placed, setPlaced] = useState(false);
  const empty = ready && cart.lines.length === 0 && !placed;

  // זהות יציבה: הטופס מחזיק אותה ב-deps של אפקט ההצלחה.
  const handlePlaced = useCallback(() => setPlaced(true), []);

  useEffect(() => {
    if (empty) router.replace('/products');
  }, [empty, router]);

  return (
    <div className="mx-auto max-w-[980px] py-4 lg:py-8">
      <header className="mb-10">
        <h1 className="text-3xl leading-tight font-extrabold tracking-[-0.02em]">קופה</h1>
        <p className="mt-2 text-glow-3">כמה פרטים וסיימנו.</p>
      </header>

      {!ready ? (
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px]" aria-busy>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-sm" />
            <Skeleton className="h-11 w-full rounded-sm" />
            <Skeleton className="h-11 w-full rounded-sm" />
          </div>
          <Skeleton className="hidden h-64 w-full rounded-lg lg:block" />
        </div>
      ) : placed ? (
        <p className="text-glow-2">ההזמנה נשמרה. פותחים את עמוד ההזמנה…</p>
      ) : empty ? (
        <p className="text-glow-2">הסל ריק. מעבירים אתכם למוצרים.</p>
      ) : (
        <CheckoutForm onPlaced={handlePlaced} />
      )}
    </div>
  );
}
