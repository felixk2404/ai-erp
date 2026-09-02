import { describe, it, expect } from 'vitest';
import { revenueByMonth, statusBreakdown, leadsFunnel, topCustomers, attentionItems } from './insights';
import type { Customer, Invoice, Lead, Task } from './types';

const inv = (o: Partial<Invoice['fields']> & { id?: string }): Invoice => ({
  id: o.id ?? Math.random().toString(36).slice(2),
  createdTime: o.Created ?? '2026-09-01T10:00:00.000Z',
  fields: { CustomerId: 'CUST-0001', Amount: 1000, Total: 1180, Status: 'generated', Created: '2026-09-01T10:00:00.000Z', ...o },
});
const lead = (o: Partial<Lead['fields']> & { id?: string }): Lead => ({
  id: o.id ?? Math.random().toString(36).slice(2),
  createdTime: '2026-09-01T10:00:00.000Z',
  fields: { Name: 'x', Status: 'New', Created: '2026-09-01T10:00:00.000Z', ...o },
});
const now = new Date('2026-09-02T12:00:00.000Z');

describe('revenueByMonth', () => {
  it('returns the last N months including empty ones, oldest first, excluding error invoices', () => {
    const rows = revenueByMonth(
      [inv({ Created: '2026-09-01T00:00:00Z', Total: 1180 }), inv({ Created: '2026-07-15T00:00:00Z', Total: 500 }), inv({ Created: '2026-09-02T00:00:00Z', Total: 99, Status: 'error' })],
      3,
      now,
    );
    expect(rows.map((r) => r.month)).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(rows.map((r) => r.total)).toEqual([500, 0, 1180]);
    expect(rows[2].count).toBe(1);
    expect(rows[2].label).toBe('ספט׳');
  });
});

describe('statusBreakdown', () => {
  it('counts and sums per status in fixed order, treating missing status as new', () => {
    const rows = statusBreakdown([inv({ Status: 'paid', Total: 10 }), inv({ Status: undefined, Total: 5 }), inv({ Status: 'paid', Total: 20 })]);
    expect(rows.map((r) => r.status)).toEqual(['new', 'validated', 'generated', 'paid', 'error']);
    expect(rows.find((r) => r.status === 'paid')).toEqual({ status: 'paid', count: 2, total: 30 });
    expect(rows.find((r) => r.status === 'new')?.count).toBe(1);
  });
});

describe('leadsFunnel', () => {
  it('counts the funnel stages and the rest separately', () => {
    const f = leadsFunnel([lead({ Status: 'New' }), lead({ Status: 'Contacted' }), lead({ Status: 'Qualified' }), lead({ Status: 'Dead' }), lead({ Status: 'Duplicate' }), lead({ Status: undefined })]);
    expect(f.stages).toEqual([
      { status: 'New', count: 2 },
      { status: 'Contacted', count: 1 },
      { status: 'Qualified', count: 1 },
    ]);
    expect(f.other).toEqual({ Dead: 1, Duplicate: 1 });
    expect(f.conversion).toBe(25); // 1 qualified of 4 in the funnel
  });
});

describe('topCustomers', () => {
  it('ranks customers by revenue and resolves names', () => {
    const customers: Customer[] = [
      { id: 'a', createdTime: '', fields: { CustomerId: 'CUST-0001', Name: 'דוד' } },
      { id: 'b', createdTime: '', fields: { CustomerId: 'CUST-0002', Name: 'רות' } },
    ];
    const rows = topCustomers([inv({ CustomerId: 'CUST-0002', Total: 900 }), inv({ CustomerId: 'CUST-0001', Total: 100 }), inv({ CustomerId: 'CUST-0002', Total: 100 })], customers, 5);
    expect(rows).toEqual([
      { customerId: 'CUST-0002', name: 'רות', href: '/customers/b', total: 1000, count: 2 },
      { customerId: 'CUST-0001', name: 'דוד', href: '/customers/a', total: 100, count: 1 },
    ]);
  });
});

describe('attentionItems', () => {
  it('flags overdue invoices, errors, and stale leads, most severe first', () => {
    const tasks: Task[] = [];
    const items = attentionItems({
      invoices: [
        inv({ id: 'old', InvoiceNumber: 'INV-0001', Status: 'generated', Created: '2026-08-01T00:00:00Z', Total: 1180 }),
        inv({ id: 'err', Status: 'error', Created: '2026-09-02T00:00:00Z' }),
        inv({ id: 'fresh', InvoiceNumber: 'INV-0002', Status: 'generated', Created: '2026-09-01T00:00:00Z' }),
      ],
      leads: [lead({ id: 'stale', Name: 'ישן', Status: 'Contacted', Created: '2026-08-10T00:00:00Z' }), lead({ id: 'ok', Status: 'Contacted', Created: '2026-09-01T00:00:00Z' })],
      tasks,
      now,
    });
    expect(items.map((i) => i.kind)).toEqual(['error', 'overdue', 'stale-lead']);
    expect(items[1]).toMatchObject({ severity: 'amber', href: '/invoices/old' });
    expect(items[0].severity).toBe('red');
    expect(items[2].href).toBe('/leads?status=Contacted');
  });
  it('returns an empty list when everything is fine', () => {
    expect(attentionItems({ invoices: [inv({ Status: 'paid' })], leads: [], tasks: [], now })).toEqual([]);
  });
});
