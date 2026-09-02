import Image from 'next/image';
import type { Metadata } from 'next';
import { ChatPanel } from '@/components/chat/chat-panel';
import { sendSupport } from './actions';
import { SUPPORT_INTRO, SUPPORT_SUGGESTIONS } from '@/components/chat/support-widget';

export const metadata: Metadata = {
  title: 'שירות לקוחות · איי.איי אלקטרוניקה',
  description: 'עונים על מדיניות, משלוחים, אחריות ומוצרים — 24/7',
};

/** עמוד ציבורי (ללא סיסמה): שירות הלקוחות של החנות עם סוכן ה-RAG. */
export default function SupportPage() {
  return (
    <main className="min-h-dvh flex flex-col">
      <header className="border-b border-rule bg-void/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/brand/logo-mark.png" alt="" width={36} height={36} priority />
            <div className="leading-tight">
              <div className="font-display font-bold">איי.איי אלקטרוניקה</div>
              <div className="text-[12px] text-ink-3">מוצרים מקוריים · אחריות יבואן רשמי</div>
            </div>
          </div>
          <a href="https://t.me/aielec_support_bot" target="_blank" rel="noreferrer" className="text-xs text-inkblue hover:text-inkblue-hover">
            גם בטלגרם ↗
          </a>
        </div>
      </header>

      <section className="max-w-3xl mx-auto w-full px-4 pt-8 pb-4 grid md:grid-cols-[1fr_220px] gap-6 items-end">
        <div>
          <div className="text-[12px] font-medium tracking-wide text-ink-3">שירות לקוחות</div>
          <h1 className="text-[28px] md:text-[34px] font-bold leading-tight mt-1">איך אפשר לעזור?</h1>
          <p className="text-ink-2 mt-2 max-w-prose">נציג ה-AI שלנו עונה מיד על שאלות על משלוחים, החזרות, אחריות, תשלומים ועל כל אחד מהמוצרים בקטלוג. שאלות מסובכות עוברות לנציג אנושי בשעות הפעילות: א׳–ה׳ 9:00–18:00, ו׳ 9:00–13:00.</p>
        </div>
        <div className="relative hidden md:block aspect-[4/3] rounded-lg overflow-hidden border border-rule">
          <Image src="/brand/hero.webp" alt="" fill sizes="220px" className="object-cover" />
        </div>
      </section>

      <section className="max-w-3xl mx-auto w-full px-4 pb-10 flex-1">
        <div className="panel p-4 md:p-5 h-[560px] flex flex-col">
          <ChatPanel sendAction={sendSupport} intro={SUPPORT_INTRO} suggestions={SUPPORT_SUGGESTIONS} agentLabel="נציג שירות · איי.איי אלקטרוניקה" placeholder="כתבו שאלה… (Enter לשליחה)" />
        </div>
        <p className="text-[12px] text-ink-3 mt-3 text-center">התשובות מבוססות על מדיניות החנות וקטלוג המוצרים. אין למסור פרטי אשראי בצ׳אט.</p>
      </section>
    </main>
  );
}
