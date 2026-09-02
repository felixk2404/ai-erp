import type { OrderStatus } from './types';

/** מספר הזמנה חסין קלט: טרים, אותיות גדולות, רק `[A-Z0-9-]` — תואם ל"לא רגיש לאותיות" ב-WF13 (§7.1). */
export function normalizeOrderNumber(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
}

/** אימייל להשוואה מול ה-ERP: טרים + אותיות קטנות. */
export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

/** ציר ההתקדמות החיובי של הזמנה. `cancelled` יוצא מהציר — הוא מוצג כמצב חריג נפרד, לא כשלב חמישי. */
export const STATUS_STEPS = ['new', 'confirmed', 'shipped', 'delivered'] as const;

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'התקבלה',
  confirmed: 'אושרה',
  shipped: 'נשלחה',
  delivered: 'נמסרה',
  cancelled: 'בוטלה',
};

/** אינדקס השלב הנוכחי בציר (0–3); `-1` עבור `cancelled` או סטטוס לא מוכר. */
export function stepIndex(status: OrderStatus): number {
  return (STATUS_STEPS as readonly string[]).indexOf(status);
}

/** מוסיף הנחיה לניסיון חוזר כשה-ERP לא מצא את ההזמנה — `includes` ולא שוויון מדויק, כדי לא להישבר על ניסוח קצת שונה. */
export function withRetryHint(error: string): string {
  return error.includes('לא נמצאה') ? `${error} — בדקו את המספר והאימייל` : error;
}
