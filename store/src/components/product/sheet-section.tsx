import { EYEBROW } from '@/lib/ui';

/**
 * המעטפת החוזרת של "גיליון" בעמוד המוצר: תווית + לוח panel-1 עם גבול rule.
 * קיימת כדי ש"מפרט" ו"פרטים" יהיו אותו אובייקט ויזואלי בלי להעתיק מחלקות.
 */
export function SheetSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className={EYEBROW}>{label}</h2>
      <div className="mt-4 overflow-hidden rounded-md border border-rule bg-panel-1">{children}</div>
    </section>
  );
}
