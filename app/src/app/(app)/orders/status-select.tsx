'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { ORDER_STATUSES } from '@/lib/types';
import { statusMeta } from '@/lib/status';
import { setOrderStatus } from './actions';

export function OrderStatusSelect({ id, orderNumber, status }: { id: string; orderNumber: string; status?: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="סטטוס הזמנה"
      defaultValue={status ?? 'new'}
      // השבתה באמצע אינטראקציה מאבדת את המיקוד מה-select עצמו — שומרים אותו פעיל ומגנים בקוד
      aria-busy={pending}
      onChange={(e) => {
        if (pending) return;
        const value = e.target.value;
        start(async () => {
          const r = await setOrderStatus(id, orderNumber, value);
          if (r.error) toast.error(r.error);
          else if (r.message) toast.success(r.message);
        });
      }}
      className="h-9 rounded-md border border-input bg-well px-2 text-sm text-ink-2 aria-busy:opacity-60"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {statusMeta('Orders', s).label}
        </option>
      ))}
    </select>
  );
}
