/**
 * לוג שרת. Vercel אוסף stderr אוטומטית, אז console.error עם קידומת קבועה מספיק —
 * מחפשים "[erp]" בלוגים ומקבלים את הסיבה האמיתית. למשתמש אף פעם לא מוצג הפרט הזה.
 */
export function logError(context: string, detail: unknown) {
  console.error('[erp]', context, detail);
}
