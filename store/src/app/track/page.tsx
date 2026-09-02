import type { Metadata } from 'next';
import { LookupForm } from '@/components/orders/lookup-form';

export const metadata: Metadata = { title: 'מעקב הזמנה' };

export default function TrackPage() {
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-sm flex-col items-center justify-center gap-8 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-display leading-[1.05] font-extrabold tracking-[-0.02em] text-glow">מעקב הזמנה</h1>
        <p className="text-glow-3">מספר הזמנה ואימייל, ומיד רואים איפה זה עומד.</p>
      </div>
      <LookupForm className="w-full text-start" />
    </div>
  );
}
