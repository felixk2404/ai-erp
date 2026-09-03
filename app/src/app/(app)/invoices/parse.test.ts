import { describe, it, expect } from 'vitest';
import { parseInvoiceForm } from './parse';
import { round2 } from '@/lib/invoice-items';

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, v));
  return f;
};
const items = JSON.stringify([
  { sku: 'TY-HP-200', name: 'אוזניות', qty: 2, price: 349 },
  { sku: 'TY-CB-HD21', name: 'כבל', qty: 1, price: 59.9 },
]);

describe('parseInvoiceForm', () => {
  it('treats the catalog prices as VAT-inclusive: rows sum to Total, VAT extracted from it', () => {
    const r = parseInvoiceForm(fd({ CustomerId: 'CUST-0001', Items: items }));
    expect(r).toEqual({ ok: true, data: { CustomerId: 'CUST-0001', Items: items, Amount: 642.29, VatAmount: 115.61, Total: 757.9 } });
    // ההוכחה שהחשבונית מסתדרת: סכום השורות = Total, ולפני מע"מ + מע"מ = Total
    if (r.ok) expect(round2(r.data.Amount + r.data.VatAmount)).toBe(r.data.Total);
  });

  it('rejects a missing customer and an empty item list with hebrew messages', () => {
    const r = parseInvoiceForm(fd({ CustomerId: '', Items: '[]' }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.CustomerId).toMatch(/לקוח/);
      expect(r.errors.Items).toMatch(/מוצר אחד/);
    }
  });

  it('rejects malformed items json', () => {
    const r = parseInvoiceForm(fd({ CustomerId: 'CUST-0001', Items: '{oops' }));
    expect(r.ok).toBe(false);
  });
});
