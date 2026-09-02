import type { ReactNode } from 'react';
import { ChatSheet } from '@/components/chat/chat-sheet';

export function Header({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4 pb-6">
      <h1 className="text-[28px] font-bold leading-none">{title}</h1>
      <div className="flex items-center gap-2">
        {actions}
        <ChatSheet />
      </div>
    </header>
  );
}
