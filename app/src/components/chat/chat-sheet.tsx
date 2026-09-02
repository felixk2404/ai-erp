'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ChatPanel } from './chat-panel';

/** "שאל את המנהל" — פאנל צ'אט שנפתח מצד שמאל (הצד הרחוק מהניווט ב-RTL). */
export function ChatSheet() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>שאל את המנהל</SheetTrigger>
      <SheetContent side="left" dir="rtl" className="w-[420px] sm:max-w-[420px] max-sm:w-full flex flex-col p-5">
        <SheetHeader className="p-0 pe-8 text-start">
          <SheetTitle>סוכן המנהל</SheetTitle>
          <SheetDescription>שאלות על הכנסות, חשבוניות, לידים ומשימות — מהנתונים החיים.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 min-h-0 mt-2">
          <ChatPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
