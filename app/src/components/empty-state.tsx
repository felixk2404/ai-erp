import Image from 'next/image';
import type { ReactNode } from 'react';

export type Illustration = 'invoices' | 'leads' | 'customers' | 'products' | 'tasks';

export function EmptyState({ title, hint, action, illustration }: { title: string; hint?: string; action?: ReactNode; illustration?: Illustration }) {
  return (
    <div className="text-center py-12 px-6 text-ink-2">
      {illustration && (
        <div className="mx-auto mb-3 size-40 rounded-full overflow-hidden ring-1 ring-white/10 bg-chassis-2 shadow-[0_0_60px_-20px_var(--signal-glow)]">
          <Image src={`/brand/empty-${illustration}.webp`} alt="" width={160} height={160} className="opacity-90" priority={false} />
        </div>
      )}
      <p className="font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 text-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
