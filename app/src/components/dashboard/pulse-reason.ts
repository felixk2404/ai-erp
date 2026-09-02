import type { PulseReason } from '@/lib/n8n-health';

/**
 * טאנל מת ומפתח שנדחה הם לא "לא הגדרתם את המשתנים" — שלוש תקלות, שלוש פעולות שונות.
 * null = ה-env באמת חסר, ואז כל פאנל מציג את הנוסח שלו עם שמות המשתנים.
 */
export function reasonHint(reason?: PulseReason): string | null {
  if (reason === 'unauthorized') return 'n8n דחה את מפתח ה-API. הפיקו מפתח חדש ב-n8n ועדכנו אותו בהגדרות הסביבה.';
  if (reason === 'unreachable') return 'n8n לא עונה. בדוק ש-Docker רץ ושמנהרת ה-ngrok פתוחה.';
  return null;
}
