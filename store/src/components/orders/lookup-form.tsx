'use client';

import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeOrderNumber } from '@/lib/order-status';
import { ORDER_EMAIL_KEY } from '@/lib/ui';

export type LookupValues = { orderNumber: string; email: string };

/**
 * טופס בירור הזמנה: מספר הזמנה (קריא-בלבד כשהוא כבר ידוע מה-URL) + אימייל.
 * ברירת מחדל: שומר את האימייל ל-sessionStorage וממשיך אל `/orders/<n>`.
 * `onSubmit` מאפשר לעמוד ההזמנה "לתפוס" שליחה חוזרת ולנסות שוב באותו עמוד —
 * ניווט חוזר לאותו URL לא מבטיח הפעלה מחדש של קומפוננטת קליינט קיימת.
 */
export function LookupForm({
  orderNumber: fixedOrderNumber,
  onSubmit,
  className = '',
}: {
  orderNumber?: string;
  onSubmit?: (values: LookupValues) => void;
  className?: string;
}) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState(fixedOrderNumber ?? '');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const orderId = useId();
  const emailId = useId();
  const errorId = useId();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const on = normalizeOrderNumber(orderNumber);
    const em = email.trim();
    if (!on || !em) {
      setError('צריך מספר הזמנה ואימייל');
      return;
    }
    setError('');
    if (onSubmit) {
      onSubmit({ orderNumber: on, email: em });
      return;
    }
    try {
      sessionStorage.setItem(ORDER_EMAIL_KEY, em);
    } catch {
      // אחסון לא זמין: עדיין ננווט, עמוד ההזמנה יבקש אימייל מחדש
    }
    router.push(`/orders/${on}`);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col gap-1.5 text-start">
        <Label htmlFor={orderId}>מספר הזמנה</Label>
        <Input
          id={orderId}
          dir="ltr"
          className="num"
          placeholder="ORD-0001"
          value={orderNumber}
          readOnly={fixedOrderNumber !== undefined}
          onChange={(e) => setOrderNumber(e.target.value)}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
        />
        {fixedOrderNumber !== undefined && <p className="text-meta text-glow-3">מהקישור שפתחתם</p>}
      </div>
      <div className="flex flex-col gap-1.5 text-start">
        <Label htmlFor={emailId}>אימייל</Label>
        <Input
          id={emailId}
          type="email"
          dir="ltr"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
      <Button type="submit">בדיקת סטטוס</Button>
    </form>
  );
}
