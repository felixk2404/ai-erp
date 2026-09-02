'use client';

import { Button } from '@/components/ui/button';

/**
 * מסך הכשל של האפליקציה. בלי error.message: בייצור Next מחליף אותו במשפט באנגלית,
 * ובפיתוח הוא עלול להיות גוף התשובה של Airtable. הסיבה האמיתית נרשמת ללוג ([erp]).
 */
export function ErrorPanel({ reset }: { reset: () => void }) {
  return (
    <div className="max-w-md mx-auto mt-24 panel p-8 ring-1 ring-led-red/30">
      <h1 className="text-[22px] font-bold">משהו השתבש</h1>
      <p className="text-ink-2 mt-2 text-sm">לא הצלחנו לטעון את הנתונים. נסו שוב.</p>
      <p className="text-ink-3 mt-1 text-xs">אם זה חוזר — בדקו שה-Docker רץ ושהטאנל של n8n פתוח.</p>
      <Button onClick={reset} className="mt-6">
        נסו שוב
      </Button>
    </div>
  );
}
