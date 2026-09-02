const numberFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1180 → "1,180.00 ₪" — סימן השקל אחרי המספר, כמו בחשבונית ישראלית. */
export const ils = (n: number) => `${numberFmt.format(n)}\u00A0₪`;

/**
 * שם דגם לטיני לא נשבר באמצע: "TY-Vision QHD" סיים שורה ב-"‎-TY" ואת השאר דחף
 * לשורה הבאה — בהקשר RTL זה נראה כמו טקסט מקולקל. אחרי כל מקף שבין תו לטיני/ספרה
 * לתו לטיני/ספרה נדחף WORD JOINER (U+2060): תו רוחב-אפס בלי גליף (בלי סיכון לטופו
 * כמו במקף הלא-שביר U+2011), שאוסר שבירה בדיוק שם. `hyphens`/`word-break` לא עוזרים —
 * מקף מפורש הוא נקודת שבירה חוקית, לא חלוקה אוטומטית.
 * לתצוגה בלבד: השם נשמר גם בסל, ב-aria-label ובהתאמת תשובות הבוט, ושם התו מיותר.
 */
export const modelName = (s: string) => s.replace(/(?<=[A-Za-z0-9])-(?=[A-Za-z0-9])/g, '-\u2060');
