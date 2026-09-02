import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { AskBotButton } from "@/components/content/ask-bot-button";
import { POLICIES } from "@/content/policies";

export const metadata: Metadata = { title: "מדיניות" };

/**
 * Intent: עמוד שקט — תשובה מהירה, לא שיווק. שום beam מלבד נקודות התבליט וכפתור הבוט.
 * Hierarchy: h1 → כותרת חלק (מונו, meta) → h2 → תקציר → תבליטים → הערה חופשית.
 * Palette: void/glow בלבד, beam ל-10 נקודות התבליט ולכפתור הסיום.
 * Depth: קו rule יחיד מפריד את הניווט הצדדי מהתוכן; בלי כרטיסים, בלי הילות.
 * Typography: h1 44px/800, h2 22px/800, גוף 16/1.5, eyebrow מונו 11px.
 * Spacing: רשת 8px; פער של 64px בין סקשנים; רוחב טקסט מקסימלי 68ch.
 */
export default function PoliciesPage() {
  return (
    <div className="py-8 lg:py-12">
      <header className="max-w-[68ch]">
        <h1 className="text-[44px] leading-[1.05] font-extrabold tracking-[-0.02em] text-balance">מדיניות החנות</h1>
        <p className="mt-3 text-lg text-glow-2">משלוחים, החזרות, אחריות ותשלומים — בקצרה ובלי אותיות קטנות.</p>
      </header>

      <div className="mt-16 grid gap-12 lg:grid-cols-[200px_1fr] lg:gap-x-16">
        <nav aria-label="ניווט במדיניות" className="hidden lg:block">
          <ul className="sticky top-24 flex flex-col gap-1 border-s border-rule ps-4">
            {POLICIES.map((policy) => (
              <li key={policy.id}>
                <a
                  href={`#${policy.id}`}
                  className="flex h-9 items-center text-sm text-glow-2 transition-colors hover:text-glow focus-visible:text-glow"
                >
                  {policy.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-16">
          {POLICIES.map((policy, i) => (
            <Reveal key={policy.id} delay={i * 0.05}>
              <section id={policy.id} className="max-w-[68ch] scroll-mt-24">
                <p className="font-mono text-[11px] tracking-[0.08em] text-glow-3">
                  {String(i + 1).padStart(2, "0")} / מדיניות
                </p>
                <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.02em] text-balance">{policy.title}</h2>
                <p className="mt-2 text-glow-2">{policy.summary}</p>
                <ul className="mt-4 flex flex-col gap-2">
                  {policy.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="relative ps-5 text-sm text-glow-2 before:absolute before:start-0 before:top-[0.55em] before:size-1.5 before:rounded-full before:bg-beam"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
                {policy.body && <p className="mt-4 text-sm text-glow-3">{policy.body}</p>}
              </section>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-20 flex justify-center border-t border-rule pt-12">
        <AskBotButton />
      </div>
    </div>
  );
}
