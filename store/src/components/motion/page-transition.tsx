import { ViewTransition } from 'react';

/**
 * מעבר עמוד כיווני: nav-forward (רשימה → פרט) ו-nav-back. ברירת מחדל none —
 * כך Suspense/revalidation לא מפעילים cross-fade מיותר. ה-CSS ב-globals.css.
 */
export function DirectionalTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}

/** אלמנט משותף (תמונת מוצר, מספר הזמנה) — מתמזג בין הרשימה לעמוד הפרט. */
export function Shared({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <ViewTransition name={name} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}
