import type { ReactNode } from 'react';

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-16 px-6 text-ink-2">
      <p className="font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 text-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
