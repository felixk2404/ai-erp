import type { Metadata } from "next";
import { Fragment } from "react";
import { Reveal } from "@/components/motion/reveal";
import { EYEBROW } from "@/lib/ui";

export const metadata: Metadata = { title: "אודות" };

const STEPS = [
  { label: "הזמנה", mono: false, desc: "הלקוח מזמין באתר או מדבר עם הבוט בטלגרם." },
  { label: "n8n", mono: true, desc: "אוטומציה קולטת את האירוע, מפעילה את סוכני ה-AI ומעדכנת את Airtable." },
  { label: "חשבונית · מייל · טלגרם", mono: false, desc: "המסמך והעדכון יוצאים ללקוח בכל הערוצים כמעט בו-זמנית." },
] as const;

const STACK = ["Next.js 16", "n8n", "Airtable", "Supabase pgvector", "OpenAI"] as const;

/**
 * Intent: לבסס אמון — זה לא עוד תבנית, זה מערכת אמיתית שרצה מאחורי הקלעים.
 * Hierarchy: h1 → שני פסקאות סיפור המותג/הפרויקט → "איך זה עובד" (שלוש תחנות) → "טכנולוגיות".
 * Palette: void/glow בלבד; שום beam — אין כאן כפתור פעולה שדורש אקסנט.
 * Depth: פאנלים בגבול rule על panel-1, בלי הילה — זה עמוד הסבר, לא ויטרינת מוצר.
 * Typography: h1 44/64px, h2 22px, גוף 16/1.5, eyebrow עברי ב-Heebo 11px; מונו רק ל-0N ול-n8n.
 * Spacing: פער 64px בין הסקשנים, רוחב טקסט מקסימלי 68ch לפסקאות.
 */
export default function AboutPage() {
  return (
    <div className="py-8 lg:py-12">
      <header className="max-w-[68ch]">
        <h1 className="text-display leading-[1.05] font-extrabold tracking-[-0.02em] text-balance sm:text-hero">
          חנות שמריצים בה סוכני AI
        </h1>
      </header>

      <div className="mt-8 flex max-w-[68ch] flex-col gap-4 text-glow-2">
        <p>
          איי.איי אלקטרוניקה היא חנות אלקטרוניקה שמוכרת אך ורק מוצרים מקוריים עם אחריות יבואן רשמי — טלפונים,
          מחשבים, אוזניות ואביזרים לבית ולעסק. מאחורי כל הזמנה עומד צוות שירות זמין דרך בוט טלגרם, לצד סוכני AI
          שעוזרים למצוא מוצר, לעקוב אחרי משלוח ולפתוח בקשת החזרה בלי להמתין בתור.
        </p>
        <p>
          החנות היא פרויקט הגמר שלי בקורס AI בג&rsquo;ון ברייס. הבסיס העסקי מנוהל ב-Airtable, האוטומציה בין
          ההזמנה לחשבונית ולהודעות רצה על n8n, וסוכני ה-AI — שירות לקוחות, מכירות וניהול — בנויים מעל אותם
          נתונים. חנות ה-Next.js הזאת היא הפנים שרואה הלקוח.
        </p>
      </div>

      <Reveal className="mt-16">
        <section>
          <p className={EYEBROW}>איך זה עובד</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-balance">
            מהזמנה למסמך, בלי מגע יד אדם
          </h2>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-stretch">
            {STEPS.map((step, i) => (
              <Fragment key={step.label}>
                <div className="flex-1 rounded-lg border border-rule bg-panel-1 p-4">
                  <p className={`num ${EYEBROW}`}>{`0${i + 1}`}</p>
                  <p className={`mt-1 text-sm text-glow ${step.mono ? "font-mono" : "font-sans font-medium"}`}>{step.label}</p>
                  <p className="mt-2 text-sm text-glow-2">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div aria-hidden className="flex items-center justify-center text-glow-4">
                    <span className="md:hidden">↓</span>
                    <span className="hidden md:inline">←</span>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.05} className="mt-16">
        <section>
          <p className={EYEBROW}>טכנולוגיות</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {STACK.map((tech) => (
              <li key={tech} className="rounded-full border border-rule px-3 py-1.5 font-mono text-sm text-glow-2">
                {tech}
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
    </div>
  );
}
