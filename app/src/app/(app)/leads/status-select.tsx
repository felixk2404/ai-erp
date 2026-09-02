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
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value;
        start(async () => {
          const r = await setLeadStatus(id, value);
          if (r.error) toast.error(r.error);
        });
      }}
      className="h-8 rounded-md border border-input bg-paper-3 px-2 text-sm text-ink-2 disabled:opacity-60"
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {statusMeta('Leads', s).label}
        </option>
      ))}
    </select>
  );
}
