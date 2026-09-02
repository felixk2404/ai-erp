'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export type ActionResult = { ok?: boolean; error?: string; message?: string };

type Props = {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  pendingText?: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
  size?: React.ComponentProps<typeof Button>['size'];
  className?: string;
  'aria-label'?: string;
};

/**
 * כפתור שמריץ server action עם מצב המתנה ו-toast לתוצאה.
 * `aria-disabled` ולא `disabled` — כפתור מושבת נושר מסדר ה-tab והמיקוד נופל ל-<body>
 * בדיוק בזמן שהפעולה רצה (2.4.3). ההגנה על לחיצה כפולה עברה לתוך ה-handler.
 */
export function ActionButton({ action, children, pendingText = 'רגע…', variant = 'outline', size = 'sm', className, ...rest }: Props) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`aria-disabled:opacity-60 ${className ?? ''}`}
      aria-disabled={pending}
      aria-label={rest['aria-label']}
      onClick={() => {
        if (pending) return;
        start(async () => {
          try {
            const r = await action();
            if (r.error) toast.error(r.error);
            else if (r.message) toast.success(r.message);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'הפעולה נכשלה');
          }
        });
      }}
    >
      {pending ? pendingText : children}
      <span aria-live="polite" className="sr-only">
        {pending ? pendingText : ''}
      </span>
    </Button>
  );
}
