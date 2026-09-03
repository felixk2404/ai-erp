import { describe, it, expect } from 'vitest';
import { revenueByMonth, statusBreakdown, leadsFunnel, topCustomers, attentionItems } from './insights';
import type { Customer, Invoice, Lead, Order, Task } from './types';

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
const order = (o: Partial<Order['fields']> & { id?: string }): Order => ({
  id: o.id ?? Math.random().toString(36).slice(2),
  createdTime: o.Created ?? '2026-09-01T10:00:00.000Z',
  fields: { OrderNumber: 'ORD-0001', Name: 'לקוח', Status: 'confirmed', Created: '2026-09-01T10:00:00.000Z', ...o },
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
    expect(rows[2].label).toBe('ספט');
  });
});

describe('statusBreakdown', () => {
  it('counts and sums per status in fixed order, treating missing status as new', () => {
    const rows = statusBreakdown([inv({ Status: 'paid', Total: 10 }), inv({ Status: undefined, Total: 5 }), inv({ Status: 'paid', Total: 20 })]);
    expect(rows.map((r) => r.status)).toEqual(['new', 'validated', 'generated', 'paid', 'error']);
    expect(rows.find((r) => r.status === 'paid')).toEqual({ status: 'paid', count: 2, total: 30 });
    expect(rows.find((r) => r.status === 'new')?.count).toBe(1);
  });

  it('keeps a status that is not in the list instead of dropping it from the chart', () => {
    const rows = statusBreakdown([inv({ Status: 'paid', Total: 10 }), inv({ Status: 'refunded' as Invoice['fields']['Status'], Total: 7 })]);
    expect(rows.reduce((s, r) => s + r.count, 0)).toBe(2);
    expect(rows.find((r) => r.status === 'refunded')).toEqual({ status: 'refunded', count: 1, total: 7 });
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
  // M-9: `${Name} לא ענה` מניח לקוח זכר — שם נשי ייצר "רונית לא ענה".
  it('phrases a stale lead without assuming the lead is male', () => {
    const [item] = attentionItems({
      invoices: [],
      leads: [lead({ id: 'stale', Name: 'רונית', Status: 'Contacted', Created: '2026-08-10T00:00:00Z' })],
      tasks: [],
      now,
    });
    expect(item.title).toBe('רונית — ללא מענה 23 ימים');
  });

  it('returns an empty list when everything is fine', () => {
    expect(attentionItems({ invoices: [inv({ Status: 'paid' })], leads: [], tasks: [], now })).toEqual([]);
  });

  it('flags records with a missing date instead of dropping them silently', () => {
    const missing = undefined as unknown as string;
    const items = attentionItems({
      invoices: [inv({ id: 'nodate', InvoiceNumber: 'INV-0009', Status: 'generated', Created: missing })],
      leads: [lead({ id: 'nodate', Name: 'רותם', Status: 'Contacted', Created: missing })],
      tasks: [],
      now,
    });
    expect(items).toHaveLength(2);
    expect(items[0].href).toBe('/invoices/nodate');
    expect(items.every((i) => !/NaN|undefined/.test(i.title))).toBe(true);
  });

  it('flags a priced invoice with no total — it is counted but adds 0 to revenue', () => {
    const items = attentionItems({ invoices: [inv({ id: 'notot', Status: 'generated', Total: undefined })], leads: [], tasks: [], now });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ severity: 'amber', href: '/invoices/notot' });
    // חשבונית חדשה עוד לא עברה חישוב מע״מ — לא מדווחים עליה
    expect(attentionItems({ invoices: [inv({ Status: 'new', Total: undefined })], leads: [], tasks: [], now })).toEqual([]);
  });

  it('names a lead with no name instead of rendering undefined', () => {
    const items = attentionItems({
      invoices: [],
      leads: [lead({ id: 'anon', Name: undefined as unknown as string, Status: 'Contacted', Created: '2026-08-10T00:00:00Z' })],
      tasks: [],
      now,
    });
    expect(items[0].title).not.toMatch(/undefined/);
  });
});

describe('attentionItems — to-ship orders', () => {
  it('does not list a fresh confirmed order', () => {
    const items = attentionItems({
      invoices: [],
      leads: [],
      tasks: [],
      orders: [order({ id: 'fresh', Status: 'confirmed', Created: '2026-09-02T00:00:00.000Z' })],
      now,
    });
    expect(items).toEqual([]);
  });

  it('lists a confirmed order older than 24h, amber, with the exact title and href', () => {
    const items = attentionItems({
      invoices: [],
      leads: [],
      tasks: [],
      orders: [order({ id: 'ord1', OrderNumber: 'ORD-0042', Name: 'דנה כהן', Status: 'confirmed', Created: '2026-09-01T11:00:00.000Z' })],
      now,
    });
    expect(items).toEqual([{ kind: 'to-ship', severity: 'amber', title: 'לשלוח ORD-0042 — דנה כהן', href: '/orders/ord1' }]);
  });

  it('lists a new order older than 24h too', () => {
    const items = attentionItems({
      invoices: [],
      leads: [],
      tasks: [],
      orders: [order({ id: 'ord2', Status: 'new', Created: '2026-09-01T11:00:00.000Z' })],
      now,
    });
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('to-ship');
  });

  it('does not list a shipped order regardless of age', () => {
    const items = attentionItems({
      invoices: [],
      leads: [],
      tasks: [],
      orders: [order({ id: 'shipped', Status: 'shipped', Created: '2026-08-01T00:00:00.000Z' })],
      now,
    });
    expect(items).toEqual([]);
  });

  it('still works for callers that omit orders entirely', () => {
    expect(attentionItems({ invoices: [], leads: [], tasks: [], now })).toEqual([]);
  });
});

describe('monthDelta', () => {
  it('compares the last month to the previous one; pct is null when previous is 0', async () => {
    const { monthDelta } = await import('./insights');
    expect(monthDelta([{ total: 1000, count: 2 }, { total: 1500, count: 3 }])).toEqual({ total: { cur: 1500, prev: 1000, pct: 50 }, count: { cur: 3, prev: 2, pct: 50 } });
    expect(monthDelta([{ total: 0, count: 0 }, { total: 200, count: 1 }])).toEqual({ total: { cur: 200, prev: 0, pct: null }, count: { cur: 1, prev: 0, pct: null } });
    expect(monthDelta([{ total: 5, count: 1 }])).toEqual({ total: { cur: 5, prev: 0, pct: null }, count: { cur: 1, prev: 0, pct: null } });
    expect(monthDelta([{ total: 200, count: 4 }, { total: 150, count: 2 }]).total.pct).toBe(-25);
  });
});
