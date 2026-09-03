'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { LEAD_STATUSES } from '@/lib/types';
import { statusMeta } from '@/lib/status';
import { setLeadStatus } from './actions';

export function LeadStatusSelect({ id, status }: { id: string; status?: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="סטטוס ליד"
      defaultValue={status ?? 'New'}
      // השבתה באמצע אינטראקציה מאבדת את המיקוד מה-select עצמו — שומרים אותו פעיל ומגנים בקוד
      aria-busy={pending}
      onChange={(e) => {
        if (pending) return;
        const value = e.target.value;
        start(async () => {
          const r = await setLeadStatus(id, value);
          if (r.error) toast.error(r.error);
        });
      }}
      className="h-9 rounded-md border border-input bg-well px-2 text-sm text-ink-2 aria-busy:opacity-60"
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {statusMeta('Leads', s).label}
        </option>
      ))}
    </select>
  );
}
