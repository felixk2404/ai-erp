import type { ReactNode } from 'react';
import { ChatSheet } from '@/components/chat/chat-sheet';

/** כותרת עמוד: Heebo 28/800 עם tracking צמוד; פעולות + "שאל את המנהל" בצד end. */
export function Header({ title, kicker, actions }: { title: string; kicker?: string; actions?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4 pb-6">
      <div>
        {kicker && <div className="mono text-[10px] tracking-[0.18em] text-readout-3 mb-1">{kicker}</div>}
        <h1 className="font-heading text-[28px] font-extrabold leading-none">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <ChatSheet />
      </div>
    </header>
  );
}
