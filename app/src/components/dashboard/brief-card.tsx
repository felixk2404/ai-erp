import { getDailyBrief } from '@/app/(app)/brief/actions';
import { RefreshBriefButton } from './refresh-brief-button';
import { ThinkingPanel } from './thinking-panel';
import { StreamText } from '@/components/motion/stream-text';

/** "תקציר בוקר" — סוכן המנהל מסכם את היום ב-3–5 שורות. נטען בסטרימינג (Suspense), נחשף מילה-מילה, נשמר 6 שעות. */
export async function BriefCard() {
  const brief = await getDailyBrief();
  const lines = brief.text
    .split('\n')
    .map((l) => l.trim().replace(/^[-•*\d.)\s]+/, ''))
    .filter(Boolean);
  const text = lines.join('\n');
  return (
    <section className="panel p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium tracking-wide text-readout-3">תקציר בוקר · סוכן המנהל</div>
          <h2 className="text-lg font-bold leading-tight mt-0.5">מה קורה היום</h2>
        </div>
        <RefreshBriefButton />
      </div>
      {brief.error ? (
        <p className="mt-4 text-sm text-readout-3">{brief.error}</p>
      ) : (
        <div className="mt-4 relative ps-4 text-sm text-readout leading-relaxed">
          <span aria-hidden className="absolute inset-y-1 start-0 w-px bg-gradient-to-b from-signal via-signal/40 to-transparent" />
          <StreamText text={text} />
        </div>
      )}
      <div className="mt-auto pt-4 flex items-center justify-between text-[11px] text-readout-3 num">
        <span>עודכן {new Date(brief.at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' })}</span>
        <span className="mono text-[10px]">gpt · RAG · airtable</span>
      </div>
    </section>
  );
}

export function BriefSkeleton() {
  return (
    <section className="panel p-5 h-full flex flex-col">
      <div className="text-[11px] font-medium tracking-wide text-readout-3">תקציר בוקר · סוכן המנהל</div>
      <h2 className="text-lg font-bold leading-tight mt-0.5">מה קורה היום</h2>
      <ThinkingPanel />
    </section>
  );
}
