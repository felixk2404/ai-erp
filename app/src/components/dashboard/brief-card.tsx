import { getDailyBrief } from '@/app/(app)/brief/actions';
import { RefreshBriefButton } from './refresh-brief-button';
import * as motion from 'motion/react-client';

/** "תקציר בוקר" — סוכן המנהל מסכם את היום ב-3–5 שורות. נטען בסטרימינג (Suspense) ונשמר 6 שעות. */
export async function BriefCard() {
  const brief = await getDailyBrief();
  const lines = brief.text.split('\n').map((l) => l.trim()).filter(Boolean);
  return (
    <section className="bg-paper-2 border border-rule rounded-lg p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium tracking-wide text-ink-3">תקציר בוקר · סוכן המנהל</div>
          <h2 className="text-lg font-bold leading-tight mt-0.5">מה קורה היום</h2>
        </div>
        <RefreshBriefButton />
      </div>
      {brief.error ? (
        <p className="mt-4 text-sm text-ink-3">{brief.error}</p>
      ) : (
        <ol className="mt-4 space-y-2.5 text-sm text-ink leading-relaxed">
          {lines.map((l, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07, duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="flex gap-3">
              <span aria-hidden className="mt-2 size-1.5 rounded-full bg-inkblue shrink-0" />
              <span>{l.replace(/^[-•*\d.)\s]+/, '')}</span>
            </motion.li>
          ))}
        </ol>
      )}
      <div className="mt-auto pt-4 text-[11px] text-ink-3 num">עודכן {new Date(brief.at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' })}</div>
    </section>
  );
}

export function BriefSkeleton() {
  return (
    <section className="bg-paper-2 border border-rule rounded-lg p-5 h-full">
      <div className="text-[11px] font-medium tracking-wide text-ink-3">תקציר בוקר · סוכן המנהל</div>
      <h2 className="text-lg font-bold leading-tight mt-0.5">מה קורה היום</h2>
      <div className="mt-4 space-y-3 animate-pulse">
        <div className="h-3.5 rounded bg-paper-3 w-[92%]" />
        <div className="h-3.5 rounded bg-paper-3 w-[80%]" />
        <div className="h-3.5 rounded bg-paper-3 w-[86%]" />
        <div className="h-3.5 rounded bg-paper-3 w-[60%]" />
      </div>
      <p className="mt-4 text-[11px] text-ink-3">הסוכן קורא את הנתונים…</p>
    </section>
  );
}
