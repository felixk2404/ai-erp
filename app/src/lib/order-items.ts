import type { InvoiceItem } from './invoice-items';

/**
 * שורת הזמנה (`Orders.Items`) היא אותו JSON בדיוק כמו שורת חשבונית — `[{sku,name,qty,price}]`,
 * מחירים כוללי מע"מ — ולכן זה אותו פרסר סלחני: קלט פגום מחזיר [] במקום להפיל את עמוד ההזמנה.
 */
export type OrderItem = InvoiceItem;
export { parseItems, lineTotal } from './invoice-items';

/** כמה יחידות בהזמנה (סכום הכמויות, לא מספר השורות) — העמודה "מוצרים" ברשימה. */
export const itemCount = (items: OrderItem[]) => items.reduce((n, i) => n + i.qty, 0);
