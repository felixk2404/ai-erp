'use client';

/**
 * מפעיל את פאנל הבוט דרך אותו CustomEvent שמשימה 11 מאזינה לו ('aie:support'),
 * בלי לייבא את הרכיב עצמו — כך שכל סקשן בדף הבית יכול לקרוא לבוט בלי לגרור אותו לבאנדל.
 * חסר סגנון בכוונה: המתקשר מחליט אם זה CTA משני ב-hero או פריט שקט בפס האמון.
 */
export function AskBot({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('aie:support'))} className={className}>
      {children}
    </button>
  );
}
