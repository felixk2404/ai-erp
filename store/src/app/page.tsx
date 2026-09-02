import { Spotlight } from '@/components/motion/spotlight';
import { WordReveal } from '@/components/motion/word-reveal';

// מציין מקום — ה-hero האמיתי נבנה במשימה 5. כאן רק כדי שהמעטפת תיראה שלמה.
export default function Home() {
  return (
    <Spotlight className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-[44px] leading-[1.05] font-extrabold tracking-[-0.02em] sm:text-[64px]">
        <WordReveal text="חדר התצוגה נדלק בקרוב" />
      </h1>
      <p className="text-glow-3">מוצרים מקוריים, אחריות יבואן, שירות AI.</p>
    </Spotlight>
  );
}
