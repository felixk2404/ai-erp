import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * סקאלת הטיפוגרפיה של החנות (`globals.css` → `@theme`) היא בשמות ולא במספרים,
 * ו-tailwind-merge לא יכול לדעת ש-`text-body` הוא *גודל*: ברירת המחדל שלו מסווגת
 * כל `text-*` לא-מוכר כצבע-טקסט. התוצאה הייתה מחיקה דו-כיוונית בתוך אותה קבוצה —
 * `twMerge('bg-beam text-void', 'px-4 text-body')` החזיר `bg-beam px-4 text-body`
 * (הכפתור הראשי יצא `glow` על `beam`, 1.67:1), ו-`text-meta text-glow-3` איבד את
 * ה-11px. ההרחבה כאן מחזירה כל אחד לקבוצה שלו, וזה גם מחזיר את ההתנגשות *הנכונה*
 * בין שני גדלים (`text-body` מול `text-lg`) שקודם שרדו שניהם.
 * `lg/xl/2xl/3xl` נשארים בחוץ — הם שמות מובנים ש-tailwind-merge כבר מכיר.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["meta", "body", "display", "hero", "hero-lg"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
