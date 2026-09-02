import { describe, it, expect } from 'vitest';
import { parseItems, sumItems, lineTotal, itemsSchema } from './invoice-items';

const items = [
  { sku: 'TY-HP-200', name: 'אוזניות', qty: 2, price: 349 },
  { sku: 'TY-CB-HD21', name: 'כבל', qty: 1, price: 59.9 },
];

describe('invoice items', () => {
  it('sums qty*price rounded to agorot', () => {
    expect(sumItems(items)).toBe(757.9);
    expect(lineTotal(items[0])).toBe(698);
    expect(sumItems([{ sku: 'a', name: 'a', qty: 3, price: 0.1 }])).toBe(0.3);
  });

  it('parses stored JSON and tolerates garbage / legacy invoices', () => {
    expect(parseItems(JSON.stringify(items))).toEqual(items);
    expect(parseItems(undefined)).toEqual([]);
    expect(parseItems('not json')).toEqual([]);
    expect(parseItems('[{"sku":"x"}]')).toEqual([]);
  });

  it('rejects empty lists and non-positive quantities', () => {
    expect(itemsSchema.safeParse([]).success).toBe(false);
    expect(itemsSchema.safeParse([{ ...items[0], qty: 0 }]).success).toBe(false);
    expect(itemsSchema.safeParse([{ ...items[0], qty: 1.5 }]).success).toBe(false);
  });
});
