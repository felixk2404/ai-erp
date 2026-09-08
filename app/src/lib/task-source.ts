import type { TaskSource } from './types';

export type TaskSourceMeta = { label: string; href: string | null };

/** מי יצר את המשימה ולאן ללכת כדי לטפל בה. `manual` וחסר = ידני, בלי קישור. */
const MAP: Record<TaskSource, { label: string; href: string | null; q: boolean }> = {
  order: { label: 'משלוח', href: '/orders', q: false },
  stock: { label: 'מלאי', href: '/products', q: true },
  lead: { label: 'ליד', href: '/leads', q: false },
  invoice: { label: 'חשבונית', href: '/invoices', q: true },
  manual: { label: 'ידני', href: null, q: false },
};

/** קישור ליעד; למקורות שמסכיהם תומכים בחיפוש, מוסיף ?q=RefId כדי לנחות על השורה. */
export function taskSourceMeta(source?: string, refId?: string): TaskSourceMeta {
  if (!source) return { label: MAP.manual.label, href: MAP.manual.href };
  // hasOwn ולא גישה ישירה: מקור בשם "constructor" מחזיר פונקציה מה-prototype ועובר את בדיקת ה-!entry
  const entry = Object.hasOwn(MAP, source) ? (MAP as Record<string, { label: string; href: string | null; q: boolean }>)[source] : undefined;
  if (!entry) return { label: source, href: null };
  const href = entry.q && entry.href && refId ? `${entry.href}?q=${encodeURIComponent(refId)}` : entry.href;
  return { label: entry.label, href };
}
