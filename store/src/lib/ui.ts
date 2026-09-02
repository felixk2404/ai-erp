import { MAX_LINES, MAX_QTY } from './cart';

/**
 * תווית-על אחת לכל האתר: היבו 500, 11px, tracking 0.08em, glow-3.
 * עברית לעולם לא במונו — ומק"ט/מספר שצריך מונו מוסיף `num` לפני זה.
 * חיה כאן ולא ליד רכיב מסוים כי משתמשים בה בקטלוג, בקופה, בעגלה ובהזמנה.
 */
export const EYEBROW = 'text-meta font-medium tracking-[0.08em] text-glow-3';

/**
 * תוצאת `useCart().add`. הוספה מוצלחת לא מקבלת טוסט (הטיסה, המונה והמגירה הן
 * האישור) — אבל *סירוב* חייב מילה, כי אחרת שום דבר על המסך לא זז.
 */
export const ADD_REFUSALS = {
  added: '',
  merged: '',
  'max-lines': `הסל מלא. אפשר עד ${MAX_LINES} מוצרים שונים`,
  'max-qty': `אי-אפשר יותר מ־${MAX_QTY} יחידות מאותו מוצר`,
} as const;
