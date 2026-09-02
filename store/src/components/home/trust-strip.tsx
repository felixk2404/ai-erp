import { MessageCircleIcon, RotateCcwIcon, ShieldCheckIcon, TruckIcon } from 'lucide-react';
import { AskBot } from '@/components/home/ask-bot';

const ITEMS = [
  { Icon: TruckIcon, title: 'משלוח 29 ₪', note: 'חינם בהזמנה מעל 300 ₪' },
  { Icon: ShieldCheckIcon, title: 'אחריות יבואן רשמי', note: 'על כל מוצר בחנות' },
  { Icon: RotateCcwIcon, title: 'החזרה תוך 14 יום', note: 'באריזה מקורית, בלי סיבה' },
] as const;

const CELL = 'flex items-start gap-3 py-4 lg:py-0';

/**
 * Intent: להסיר את שלושת החששות שעוצרים קנייה ישראלית — משלוח, אחריות, החזרה — ואז להציע נציג.
 * Hierarchy: שקט בכוונה. ארבעה פריטים שווים בסוף העמוד; שום דבר כאן לא מתחרה ב-hero.
 * Palette: אייקונים glow-3, כותרות glow, הערות glow-3. אפס beam — זה מידע, לא פעולה.
 * Depth: קו rule עליון בלבד. אין כרטיסים, אין רקע.
 * Typography: כותרת 14/500, הערה 13.
 * Spacing: ארבע עמודות מ-lg, שתיים מ-sm, אחת במובייל; מפרידי rule בין השורות במובייל.
 */
export function TrustStrip() {
  return (
    <section aria-label="תנאי קנייה" className="border-t border-rule pt-8">
      <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
        {ITEMS.map(({ Icon, title, note }) => (
          <li key={title} className={`${CELL} border-b border-rule last:border-b-0 sm:border-b-0`}>
            <Icon size={18} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-glow-3" />
            <div>
              <p className="text-[14px] font-medium text-glow">{title}</p>
              <p className="mt-0.5 text-[13px] text-glow-3">{note}</p>
            </div>
          </li>
        ))}
        <li className={CELL}>
          <MessageCircleIcon size={18} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-glow-3" />
          <AskBot className="text-start">
            <span className="block text-[14px] font-medium text-glow underline-offset-4 hover:underline">
              בוט שירות 24/7
            </span>
            <span className="mt-0.5 block text-[13px] text-glow-3">שאלו על מוצר, מלאי או הזמנה</span>
          </AskBot>
        </li>
      </ul>
    </section>
  );
}
