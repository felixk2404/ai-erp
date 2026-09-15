import { escapeFormula } from './airtable';

/**
 * חיפוש חופשי ב-Airtable: FIND על כל שדה, לא רגיש לאותיות. הערך עובר escapeFormula —
 * זה הגבול שבו קלט של משתמש נכנס לתוך נוסחה, ובלעדיו גרש אחד שובר את השאילתה.
 * מחזיר undefined לשאילתה ריקה כדי שהקורא לא ישלח filterByFormula בכלל.
 */
export function searchFormula(fields: string[], q: string): string | undefined {
  const needle = escapeFormula(q.trim().toLowerCase());
  if (!needle) return undefined;
  return `OR(${fields.map((f) => `FIND('${needle}', LOWER({${f}}))`).join(', ')})`;
}
