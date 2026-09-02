'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { refreshBrief } from '@/app/(app)/brief/actions';

export function RefreshBriefButton() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await refreshBrief();
          router.refresh();
        })
      }
      className="text-xs text-ink-3 hover:text-ink disabled:opacity-60 h-7 px-2 rounded-md hover:bg-paper-3 transition-colors"
      aria-label="רענן תקציר"
    >
      {pending ? 'מרענן…' : 'רענן'}
    </button>
  );
}
