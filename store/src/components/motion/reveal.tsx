/**
 * "נדלק" בכניסה: הפריט עולה 16px ומקבל צבע (grayscale→color) — כמו תאורת חדר
 * תצוגה שנדלקת על הפריט הבא. פעם אחת בלבד, בלי לולאה.
 *
 * CSS ולא `motion`: ל-`initial={{ opacity: 0 }}` יש מחיר שרת — motion כותב אותו
 * כ-`style="opacity:0"` כבר ב-HTML, ולכן כל הרשת מגיעה ללקוח שקופה ותלויה ב-JS
 * כדי להיראות. כאן השרת מרנדר גלוי, והדפדפן מריץ את הכניסה מה-`from` של ה-keyframe
 * (`globals.css`), כולל כיבוי נטיבי ב-`prefers-reduced-motion`.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div data-reveal style={delay ? { animationDelay: `${delay}s` } : undefined} className={className}>
      {children}
    </div>
  );
}
