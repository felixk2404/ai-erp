import { SheetSection } from '@/components/product/sheet-section';

/**
 * Intent: שלוש השורות שמכריעות קנייה, בפורמט של גיליון מפרט — לא פסקה שיווקית.
 * Hierarchy: תווית סקשן → שלוש שורות שוות משקל, כל אחת עם סמן beam.
 * Typography: הטקסט בהיבו 16 על glow; הסמן הוא ה"מספר" היחיד ולכן היחיד ב-beam.
 * הסמן מצביע ◂ ולא ▸ — ב-RTL הוא נכנס אל הטקסט, לא בורח ממנו.
 */
export function Highlights({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <SheetSection label="בקצרה">
      <ul>
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 border-t border-rule px-4 py-3 text-lg leading-6 text-glow first:border-t-0"
          >
            <span aria-hidden className="mt-px shrink-0 font-mono text-body leading-6 text-beam">
              ◂
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </SheetSection>
  );
}
