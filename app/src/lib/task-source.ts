import type { TaskSource } from './types';

export type TaskSourceMeta = { label: string; href: string | null };

/** מי יצר את המשימה ולאן ללכת כדי לטפל בה. `manual` וחסר = ידני, בלי קישור. */
const MAP: Record<TaskSource, TaskSourceMeta> = {
  order: { label: 'משלוח', href: '/customers' },
  stock: { label: 'מלאי', href: '/products' },
  lead: { label: 'ליד', href: '/leads' },
  invoice: { label: 'חשבונית', href: '/invoices' },
  manual: { label: 'ידני', href: null },
};

export function taskSourceMeta(source?: string): TaskSourceMeta {
  if (!source) return MAP.manual;
  return (MAP as Record<string, TaskSourceMeta>)[source] ?? { label: source, href: null };
}
