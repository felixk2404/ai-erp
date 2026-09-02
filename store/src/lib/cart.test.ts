import { describe, it, expect } from 'vitest';
import { cartReducer, totals, MAX_LINES, MAX_QTY, type Cart } from './cart';
const line = (sku: string, price: number, service = false) => ({ sku, name: sku, price, qty: 1, service });
const empty: Cart = { lines: [] };
describe('cart', () => {
  it('add merges same sku and caps qty', () => {
    let c = cartReducer(empty, { type: 'add', line: line('A', 10) });
    c = cartReducer(c, { type: 'add', line: { ...line('A', 10), qty: 98 } });
    c = cartReducer(c, { type: 'add', line: line('A', 10) });
    expect(c.lines).toHaveLength(1); expect(c.lines[0].qty).toBe(MAX_QTY);
  });
  it('refuses an 11th distinct line', () => {
    let c = empty; for (let i = 0; i < MAX_LINES; i++) c = cartReducer(c, { type: 'add', line: line(`S${i}`, 1) });
    expect(cartReducer(c, { type: 'add', line: line('X', 1) })).toBe(c);
  });
  it('setQty 0 removes; remove removes; clear empties', () => {
    const c = cartReducer(empty, { type: 'add', line: line('A', 10) });
    expect(cartReducer(c, { type: 'setQty', sku: 'A', qty: 0 }).lines).toHaveLength(0);
    expect(cartReducer(c, { type: 'remove', sku: 'A' }).lines).toHaveLength(0);
    expect(cartReducer(c, { type: 'clear' })).toEqual(empty);
  });
  it('totals: shipping 29 under 300, free at 300+, 0 for services-only; vat derived', () => {
    const a = totals({ lines: [{ ...line('A', 100), qty: 2 }] });
    expect(a).toMatchObject({ subtotal: 200, shipping: 29, total: 229, count: 2, freeShippingGap: 100 });
    expect(a.vat).toBe(34.93);
    expect(totals({ lines: [{ ...line('A', 150), qty: 2 }] })).toMatchObject({ shipping: 0, total: 300, freeShippingGap: 0 });
    expect(totals({ lines: [line('S', 99, true)] })).toMatchObject({ shipping: 0, total: 99, freeShippingGap: 0 });
    expect(totals(empty)).toMatchObject({ subtotal: 0, shipping: 0, total: 0, count: 0 });
  });
});
