import Image from 'next/image';
import type { ReactNode } from 'react';

export type Illustration = 'invoices' | 'leads' | 'customers' | 'products' | 'tasks';

export function EmptyState({ title, hint, action, illustration }: { title: string; hint?: string; action?: ReactNode; illustration?: Illustration }) {
  return (
    <div className="text-center py-12 px-6 text-ink-2">
      {illustration && (
        <Image src={`/brand/empty-${illustration}.webp`} alt="" width={160} height={160} className="mx-auto mb-2 rounded-full mix-blend-multiply opacity-90" priority={false} />
      )}
      <p className="font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 text-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
