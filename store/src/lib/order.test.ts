import { describe, it, expect } from 'vitest';
import { parseCheckout, toOrderPayload } from './order';
const fd = (o: Record<string, string>) => { const f = new FormData(); Object.entries(o).forEach(([k, v]) => f.set(k, v)); return f; };
const physical = JSON.stringify([{ sku: 'TY-HP-200', qty: 2, service: false }]);
const service = JSON.stringify([{ sku: 'TY-SRV-01', qty: 1, service: true }]);
describe('checkout', () => {
  it('requires address+city only when a physical item exists', () => {
    expect(parseCheckout(fd({ name: 'דוד לוי', email: 'd@x.co', phone: '050-1234567', items: physical })).ok).toBe(false);
    expect(parseCheckout(fd({ name: 'דוד לוי', email: 'd@x.co', phone: '050-1234567', address: 'הרצל 1', city: 'תל אביב', items: physical })).ok).toBe(true);
    expect(parseCheckout(fd({ name: 'דוד לוי', email: 'd@x.co', phone: '0501234567', items: service })).ok).toBe(true);
  });
  it('hebrew field errors', () => {
    const r = parseCheckout(fd({ name: 'א', email: 'bad', phone: '12', items: '[]' }));
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.errors.name).toMatch(/שם/); expect(r.errors.email).toMatch(/אימייל/); expect(r.errors.phone).toMatch(/טלפון/); expect(r.errors.items).toMatch(/ריק/); }
  });
  it('rejects over-long fields and non-string entries', () => {
    const long = parseCheckout(fd({ name: 'ד'.repeat(61), email: 'd@x.co', phone: '050-1234567', address: 'א'.repeat(121), city: 'ב', items: physical }));
    expect(long.ok).toBe(false);
    if (!long.ok) { expect(long.errors.name).toMatch(/ארוך/); expect(long.errors.address).toMatch(/ארוכה/); }
    const f = new FormData();
    f.set('name', 'דוד לוי'); f.set('email', 'd@x.co'); f.set('phone', '050-1234567'); f.set('items', physical);
    f.set('address', new File(['x'], 'a.txt')); f.set('city', 'תל אביב');
    expect(parseCheckout(f).ok).toBe(false);
  });
  it('payload strips client prices and keeps sku/qty', () => {
    const r = parseCheckout(fd({ name: 'דוד לוי', email: 'D@X.co', phone: '050-1234567', address: 'א', city: 'ב', note: 'x', items: physical }));
    if (!r.ok) throw new Error('expected ok');
    expect(toOrderPayload(r.data)).toEqual({ customer: { name: 'דוד לוי', email: 'd@x.co', phone: '050-1234567', address: 'א', city: 'ב' }, items: [{ sku: 'TY-HP-200', qty: 2 }], note: 'x' });
  });
});
