import type { TableName } from './types';

export type Led = 'green' | 'amber' | 'red' | 'off';
export type StatusMeta = { label: string; led: Led };

const MAP: Record<TableName, Record<string, StatusMeta>> = {
  // חשבונית = נקבה. סדרת עבר־נקבה אחת, כמו STATUS_LABELS בחנות — התג בטבלה וציר הזמן בעמוד קוראים מכאן.
  Invoices: {
    new: { label: 'נוצרה', led: 'amber' },
    validated: { label: 'אומתה', led: 'amber' },
    generated: { label: 'הופקה', led: 'green' },
    paid: { label: 'שולמה', led: 'green' },
    error: { label: 'שגיאה', led: 'red' },
  },
  Leads: {
    New: { label: 'חדש', led: 'amber' },
    Contacted: { label: 'נשלח מייל', led: 'amber' },
    Qualified: { label: 'ענה', led: 'green' },
    Dead: { label: 'סגור', led: 'off' },
    Duplicate: { label: 'כפול', led: 'off' },
  },
  Tasks: {
    open: { label: 'פתוחה', led: 'amber' },
    done: { label: 'בוצעה', led: 'green' },
  },
  Customers: {},
  Products: {},
};

const DEFAULT: Record<TableName, string> = { Invoices: 'new', Leads: 'New', Tasks: 'open', Customers: '', Products: '' };

export function statusMeta(table: TableName, status?: string): StatusMeta {
  const key = status ?? DEFAULT[table];
  return MAP[table][key] ?? { label: key, led: 'off' };
}
