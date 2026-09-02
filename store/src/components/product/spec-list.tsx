/**
 * Intent: שלוש השורות שמכריעות קנייה, בפורמט של גיליון מפרט — לא פסקה שיווקית.
 * Hierarchy: תווית מונו קטנה → שלוש שורות שוות משקל, כל אחת עם סמן beam.
 * Typography: הסמן במונו/beam (הוא ה"מספר"), הטקסט בהיבו 16 על glow.
 * הסמן מצביע ◂ ולא ▸ — ב-RTL הוא נכנס אל הטקסט, לא בורח ממנו.
 */
export function SpecList({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="font-mono text-[11px] leading-none tracking-[0.14em] text-glow-3">מפרט</h2>
      <ul className="mt-4 overflow-hidden rounded-[12px] border border-rule bg-panel-1">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 border-t border-rule px-4 py-3 text-[16px] leading-6 text-glow first:border-t-0"
          >
            <span aria-hidden className="mt-px shrink-0 font-mono text-[14px] leading-6 text-beam">
              ◂
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
