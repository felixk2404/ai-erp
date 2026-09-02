'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ChatPanel } from './chat-panel';
import { sendSupport } from '@/app/support/actions';

export const SUPPORT_SUGGESTIONS = ['מה מדיניות ההחזרות?', 'יש לכם אוזניות אלחוטיות?', 'כמה זמן לוקח משלוח?'];
export const SUPPORT_INTRO = 'שלום! אני נציג השירות של איי.איי אלקטרוניקה. עונה על מדיניות, משלוחים, אחריות ומוצרים — מתוך הידע של החנות.';

/** כפתור צף (end-bottom) שפותח את סוכן השירות — כדי שבעל העסק יבדוק מה הלקוחות רואים. */
export function SupportWidget() {
  return (
    <Sheet>
      <SheetTrigger
        render={<button type="button" aria-label="שירות לקוחות" />}
        className="fixed bottom-5 end-5 z-30 size-12 rounded-full bg-signal text-[#06121a] shadow-[0_8px_24px_-8px_rgba(43,76,126,.6)] grid place-items-center transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-95"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
          <path d="M9 11h6M9 14h4" />
        </svg>
      </SheetTrigger>
      <SheetContent side="left" dir="rtl" className="w-[420px] sm:max-w-[420px] max-sm:w-full flex flex-col p-5">
        <SheetHeader className="p-0 pe-8 text-start">
          <SheetTitle>שירות לקוחות</SheetTitle>
          <SheetDescription>מה שהלקוחות רואים בעמוד /support ובטלגרם.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 min-h-0 mt-2">
          <ChatPanel sendAction={sendSupport} intro={SUPPORT_INTRO} suggestions={SUPPORT_SUGGESTIONS} agentLabel="נציג שירות" compact />
        </div>
      </SheetContent>
    </Sheet>
  );
}
