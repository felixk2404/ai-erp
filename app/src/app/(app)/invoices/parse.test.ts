import { describe, it, expect } from 'vitest';
import { parseInvoiceForm } from './parse';

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe('parseInvoiceForm', () => {
  it('accepts a valid form and coerces the amount to a number', () => {
    expect(parseInvoiceForm(fd({ CustomerId: 'CUST-0001', Amount: '1000' }))).toEqual({
      ok: true,
      data: { CustomerId: 'CUST-0001', Amount: 1000 },
    });
    expect(parseInvoiceForm(fd({ CustomerId: 'CUST-0001', Amount: '349.90' }))).toEqual({
      ok: true,
      data: { CustomerId: 'CUST-0001', Amount: 349.9 },
    });
  });

  it('rejects a missing customer and a non-positive amount with hebrew messages', () => {
    const r = parseInvoiceForm(fd({ CustomerId: '', Amount: '0' }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.CustomerId).toMatch(/לקוח/);
      expect(r.errors.Amount).toMatch(/גדול מ-0/);
    }
  });

  it('rejects a non-numeric amount', () => {
    const r = parseInvoiceForm(fd({ CustomerId: 'CUST-0001', Amount: 'abc' }));
    expect(r.ok).toBe(false);
  });
});
