import { describe, it, expect } from 'vitest';
import { parseOrderForm, MAX_LINES, MAX_QTY } from './parse';

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const ok = {
  name: 'דוד לוי',
  email: ' D@Example.com ',
  phone: '050 123 4567',
  address: 'הרצל 1',
  city: 'תל אביב',
  note: '',
  items: JSON.stringify([{ sku: 'TY-PB-20', qty: 2 }]),
};

describe('parseOrderForm', () => {
  it('normalises email and phone and keeps items as sku+qty only — the price is never taken from the form', () => {
    const r = parseOrderForm(fd(ok));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toEqual({
        customer: { name: 'דוד לוי', email: 'd@example.com', phone: '0501234567', address: 'הרצל 1', city: 'תל אביב' },
        items: [{ sku: 'TY-PB-20', qty: 2 }],
        note: undefined,
      });
    }
  });

  it('reports field errors by name, first message per field', () => {
    const r = parseOrderForm(fd({ ...ok, email: 'nope', phone: '12', items: '[]' }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.email).toBeTruthy();
      expect(r.errors.phone).toBeTruthy();
      expect(r.errors.items).toBeTruthy();
      expect(r.errors.name).toBeUndefined();
    }
  });

  it('enforces the WF10 limits: up to 10 lines and 99 per line', () => {
    const eleven = JSON.stringify(Array.from({ length: MAX_LINES + 1 }, (_, i) => ({ sku: `S${i}`, qty: 1 })));
    const r1 = parseOrderForm(fd({ ...ok, items: eleven }));
    expect(r1.ok).toBe(false);
    const r2 = parseOrderForm(fd({ ...ok, items: JSON.stringify([{ sku: 'a', qty: MAX_QTY + 1 }]) }));
    expect(r2.ok).toBe(false);
    const r3 = parseOrderForm(fd({ ...ok, items: JSON.stringify([{ sku: 'a', qty: MAX_QTY }]) }));
    expect(r3.ok).toBe(true);
  });

  it('treats unparsable items JSON as a field error, not a crash', () => {
    const r = parseOrderForm(fd({ ...ok, items: '{not json' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.items).toBeTruthy();
  });

  it('drops empty optional fields instead of sending empty strings to WF10', () => {
    const r = parseOrderForm(fd({ ...ok, address: '  ', city: '', note: '   ' }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.customer.address).toBeUndefined();
      expect(r.data.customer.city).toBeUndefined();
      expect(r.data.note).toBeUndefined();
    }
  });
});
