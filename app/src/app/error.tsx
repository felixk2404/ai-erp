'use client';

import { ErrorPanel } from '@/components/error-panel';

/**
 * גבול שגיאה מעל הכל: error.tsx לא תופס את ה-layout של הסגמנט שלו, אז כשל של
 * (app)/layout.tsx — חמש קריאות Airtable — נחת קודם על מסך ברירת המחדל של Next באנגלית.
 * מכאן הוא מכוסה, וגם /support ו-/login שאין להם גבול משלהם.
 */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel reset={reset} />;
}
