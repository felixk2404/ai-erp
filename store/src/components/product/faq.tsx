import { FAQ } from '@/content/policies';

/**
 * Intent: ארבע ההתנגדויות שעוצרות קנייה — משלוח, החזרה, אחריות, תשלום —
 * במקום שבו הן עולות, בלי לשלוח את הקונה לעמוד המדיניות.
 * Hierarchy: שאלה 16/500 על glow, תשובה 14 על glow-2; הסימן + מסתובב ל-× בפתיחה.
 * מימוש: <details> מקורי — נגיש ועובד בלי JS, בלי ספריית אקורדיון.
 */
export function Faq() {
  return (
    <section className="mt-16 grid gap-6 lg:mt-24 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-16">
      <h2 className="text-[22px] leading-tight font-extrabold tracking-[-0.02em]">שאלות נפוצות</h2>
      <div className="overflow-hidden rounded-md border border-rule bg-panel-1">
        {FAQ.slice(0, 4).map((item) => (
          <details key={item.q} className="group border-t border-rule first:border-t-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-[16px] leading-6 font-medium text-glow [&::-webkit-details-marker]:hidden">
              {item.q}
              <span
                aria-hidden
                className="relative size-3.5 shrink-0 text-glow-3 transition-transform duration-200 group-open:rotate-45 group-open:text-beam"
              >
                <span className="absolute inset-0 m-auto h-px w-full bg-current" />
                <span className="absolute inset-0 m-auto h-full w-px bg-current" />
              </span>
            </summary>
            <p className="max-w-[68ch] px-4 pb-4 text-[14px] leading-6 text-glow-2">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
