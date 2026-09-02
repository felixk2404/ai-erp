export const MAX_LINES = 10, MAX_QTY = 99, FREE_SHIPPING_FROM = 300, SHIPPING = 29;
export type CartLine = { sku: string; name: string; price: number; qty: number; service: boolean; imageUrl?: string };
export type Cart = { lines: CartLine[] };
export type CartAction = { type: 'add'; line: CartLine } | { type: 'remove'; sku: string } | { type: 'setQty'; sku: string; qty: number } | { type: 'clear' };
const round2 = (n: number) => Math.round(n * 100) / 100;
export function cartReducer(cart: Cart, a: CartAction): Cart {
  switch (a.type) {
    case 'add': {
      const i = cart.lines.findIndex((l) => l.sku === a.line.sku);
      if (i === -1) return cart.lines.length >= MAX_LINES ? cart : { lines: [...cart.lines, { ...a.line, qty: Math.min(MAX_QTY, Math.max(1, a.line.qty)) }] };
      const lines = cart.lines.slice(); lines[i] = { ...lines[i], qty: Math.min(MAX_QTY, lines[i].qty + a.line.qty) }; return { lines };
    }
    case 'remove': return { lines: cart.lines.filter((l) => l.sku !== a.sku) };
    case 'setQty': return a.qty <= 0 ? { lines: cart.lines.filter((l) => l.sku !== a.sku) } : { lines: cart.lines.map((l) => (l.sku === a.sku ? { ...l, qty: Math.min(MAX_QTY, a.qty) } : l)) };
    case 'clear': return { lines: [] };
  }
}
export function totals(cart: Cart) {
  const subtotal = round2(cart.lines.reduce((s, l) => s + l.price * l.qty, 0));
  const physical = cart.lines.some((l) => !l.service);
  const shipping = !physical || subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING;
  const total = round2(subtotal + shipping);
  return { subtotal, shipping, total, vat: round2(total - total / 1.18), count: cart.lines.reduce((s, l) => s + l.qty, 0), freeShippingGap: physical ? Math.max(0, round2(FREE_SHIPPING_FROM - subtotal)) : 0 };
}
