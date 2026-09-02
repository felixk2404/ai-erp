import { describe, it, expect } from 'vitest';
import { statusMeta } from './status';
import { INVOICE_STATUSES } from './types';

describe('statusMeta', () => {
  // החשבונית היא ישות נקבה — כל תווית בעבר־נקבה, כמו STATUS_LABELS של החנות.
  it('maps invoice statuses to feminine hebrew labels and led colors', () => {
    expect(statusMeta('Invoices', 'generated')).toEqual({ label: 'הופקה', led: 'green' });
    expect(statusMeta('Invoices', 'validated')).toEqual({ label: 'אומתה', led: 'amber' });
    expect(statusMeta('Invoices', 'paid')).toEqual({ label: 'שולמה', led: 'green' });
    expect(statusMeta('Invoices', 'error')).toEqual({ label: 'שגיאה', led: 'red' });
    expect(statusMeta('Invoices', undefined)).toEqual({ label: 'נוצרה', led: 'amber' });
  });

  // I-4: לעמוד החשבונית היה מפתח תוויות משלו, ושתי התוויות הופיעו יחד על אותו מסך.
  it('is the only source of invoice status labels — no second map to drift from', () => {
    expect(INVOICE_STATUSES.map((s) => statusMeta('Invoices', s).label)).toEqual(['נוצרה', 'אומתה', 'הופקה', 'שולמה', 'שגיאה']);
  });

  it('maps lead statuses', () => {
    expect(statusMeta('Leads', 'Qualified').led).toBe('green');
    expect(statusMeta('Leads', 'Dead').led).toBe('off');
    expect(statusMeta('Leads', undefined).label).toBe('חדש');
    // I-8: שם שלב אחד למשפך, לא שלושה
    expect(statusMeta('Leads', 'Qualified').label).toBe('ענה');
  });

  it('falls back to the raw value for unknown statuses', () => {
    expect(statusMeta('Leads', 'weird')).toEqual({ label: 'weird', led: 'off' });
  });

  it('maps tasks', () => {
    expect(statusMeta('Tasks', 'done')).toEqual({ label: 'בוצעה', led: 'green' });
    expect(statusMeta('Tasks', undefined)).toEqual({ label: 'פתוחה', led: 'amber' });
  });
});
