import { describe, it, expect } from 'vitest';
import { lookupResultSchema, orderResultSchema, parseCheckout, toOrderPayload } from './order';
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

/**
 * חוזה WF13 (runbook §7.1) הוא הגבול היחיד שהחנות לא מפעילה בעצמה, והוא היה
 * מומר בהצהרה. שדה שנעלם בצד השני צריך להגיע לקורא כתקלה מטופלת ("השירות
 * לא זמין"), לא כ-`items.map` על `null` שמפיל את העמוד.
 */
describe('WF13 wire contracts', () => {
  const order = {
    orderNumber: 'ORD-0001',
    status: 'confirmed',
    items: [{ sku: 'TY-HP-200', name: 'אוזניות', qty: 1, price: 349 }],
    subtotal: 439,
    shipping: 0,
    total: 439,
    created: '2026-09-02T14:37:30.000Z',
    invoiceNumber: 'INV-0003',
    pdfUrl: 'https://drive.google.com/x',
    invoiceStatus: 'generated',
  };

  it('accepts the documented order_status bodies', () => {
    expect(lookupResultSchema.parse({ ok: true, order })).toMatchObject({ ok: true });
    expect(lookupResultSchema.parse({ ok: false, error: 'ההזמנה לא נמצאה' })).toEqual({ ok: false, error: 'ההזמנה לא נמצאה' });
  });

  it('normalises the fields WF8 leaves empty and tolerates a missing created', () => {
    const r = lookupResultSchema.parse({ ok: true, order: { ...order, created: undefined, pdfUrl: undefined, invoiceStatus: null } });
    if (!r.ok) throw new Error('expected ok');
    expect(r.order).toMatchObject({ created: '', pdfUrl: null, invoiceStatus: null });
  });

  it('rejects a body that would break the tracking page', () => {
    expect(lookupResultSchema.safeParse({ ok: true, order: { ...order, items: null } }).success).toBe(false);
    expect(lookupResultSchema.safeParse({ ok: true, order: { ...order, total: '439' } }).success).toBe(false);
    expect(lookupResultSchema.safeParse({ ok: true }).success).toBe(false);
  });

  it('accepts the documented order bodies and rejects a truncated success', () => {
    expect(orderResultSchema.parse({ ok: true, orderNumber: 'ORD-0003', invoiceNumber: 'INV-0005', subtotal: 189, shipping: 29, vat: 33.25, total: 218, items: [{ sku: 'TY-PB-20', name: 'סוללה', qty: 1, price: 189 }] })).toMatchObject({ ok: true });
    expect(orderResultSchema.parse({ ok: false, error: 'חלק מהפריטים אינם במלאי', outOfStock: [{ sku: 'TY-HP-200', name: 'אוזניות', available: 2 }] })).toMatchObject({ ok: false });
    expect(orderResultSchema.safeParse({ ok: true, orderNumber: 'ORD-0003' }).success).toBe(false);
  });
});
