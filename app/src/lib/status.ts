import type { TableName } from './types';

export type Led = 'green' | 'amber' | 'red' | 'off';
export type StatusMeta = { label: string; led: Led };

const MAP: Record<TableName, Record<string, StatusMeta>> = {
  Invoices: {
    new: { label: 'חדש', led: 'amber' },
    validated: { label: 'אומת', led: 'amber' },
    generated: { label: 'הופק PDF', led: 'green' },
    paid: { label: 'שולם', led: 'green' },
    error: { label: 'שגיאה', led: 'red' },
  },
  Leads: {
    New: { label: 'חדש', led: 'amber' },
    Contacted: { label: 'נשלח מייל', led: 'amber' },
    Qualified: { label: 'ענה — מתאים', led: 'green' },
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
