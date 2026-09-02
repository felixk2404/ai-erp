import { describe, it, expect } from 'vitest';
import { statusMeta } from './status';

describe('statusMeta', () => {
  it('maps invoice statuses to hebrew labels and led colors', () => {
    expect(statusMeta('Invoices', 'generated')).toEqual({ label: 'הופק PDF', led: 'green' });
    expect(statusMeta('Invoices', 'validated')).toEqual({ label: 'אומת', led: 'amber' });
    expect(statusMeta('Invoices', 'paid')).toEqual({ label: 'שולם', led: 'green' });
    expect(statusMeta('Invoices', 'error')).toEqual({ label: 'שגיאה', led: 'red' });
    expect(statusMeta('Invoices', undefined)).toEqual({ label: 'חדש', led: 'amber' });
  });

  it('maps lead statuses', () => {
    expect(statusMeta('Leads', 'Qualified').led).toBe('green');
    expect(statusMeta('Leads', 'Dead').led).toBe('off');
    expect(statusMeta('Leads', undefined).label).toBe('חדש');
  });

  it('falls back to the raw value for unknown statuses', () => {
    expect(statusMeta('Leads', 'weird')).toEqual({ label: 'weird', led: 'off' });
  });

  it('maps tasks', () => {
    expect(statusMeta('Tasks', 'done')).toEqual({ label: 'בוצעה', led: 'green' });
    expect(statusMeta('Tasks', undefined)).toEqual({ label: 'פתוחה', led: 'amber' });
  });
});
