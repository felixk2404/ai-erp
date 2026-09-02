/** תווית סקשן אחידה בעמוד המוצר: היבו, 11px, tracking 0.08em — עברית לעולם לא במונו. */
export const SECTION_LABEL = 'text-[11px] leading-none font-medium tracking-[0.08em] text-glow-3';

/**
 * המעטפת החוזרת של "גיליון" בעמוד המוצר: תווית + לוח panel-1 עם גבול rule.
 * קיימת כדי ש"מפרט" ו"פרטים" יהיו אותו אובייקט ויזואלי בלי להעתיק מחלקות.
 */
export function SheetSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className={SECTION_LABEL}>{label}</h2>
      <div className="mt-4 overflow-hidden rounded-md border border-rule bg-panel-1">{children}</div>
    </section>
  );
}
