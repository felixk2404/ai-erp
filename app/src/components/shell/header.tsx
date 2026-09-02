import type { ReactNode } from 'react';
import { ChatSheet } from '@/components/chat/chat-sheet';

/** כותרת עמוד: Heebo 28/800 עם tracking צמוד; פעולות + "שאל את המנהל" בצד end. */
export function Header({ title, kicker, actions }: { title: string; kicker?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-6">
      <div>
        {kicker && (
          <div lang="en" className="mono text-[10px] tracking-[0.18em] text-readout-3 mb-1">
            {kicker}
          </div>
        )}
        <h1 className="font-heading text-[28px] font-extrabold leading-none">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        <ChatSheet />
      </div>
    </header>
  );
}
