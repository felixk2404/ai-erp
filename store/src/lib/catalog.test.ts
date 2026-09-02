import { describe, it, expect } from 'vitest';
import { isService, inStock, highlights, related, categories } from './catalog';
import type { Product } from './types';
const p = (o: Partial<Product['fields']>, id = o.Sku ?? 'x'): Product => ({ id, createdTime: '', fields: { Name: 'n', ...o } });
describe('catalog', () => {
  it('services are always in stock, physical follow Stock', () => {
    expect(inStock(p({ Category: 'שירותים' }))).toBe(true);
    expect(inStock(p({ Category: 'כבלים', Stock: 0 }))).toBe(false);
    expect(inStock(p({ Category: 'כבלים', Stock: 3 }))).toBe(true);
    expect(inStock(p({ Category: 'כבלים' }))).toBe(false);
    expect(isService(p({ Category: 'שירותים' }))).toBe(true);
  });
  it('highlights: up to 3 non-empty lines', () => {
    expect(highlights(p({ Highlights: 'a\n\nb\nc\nd' }))).toEqual(['a', 'b', 'c']);
    expect(highlights(p({}))).toEqual([]);
  });
  it('related: same category, in stock first, excludes self, max n', () => {
    const all = [p({ Sku: 'A', Category: 'c1', Stock: 1 }), p({ Sku: 'B', Category: 'c1', Stock: 0 }), p({ Sku: 'C', Category: 'c1', Stock: 5 }), p({ Sku: 'D', Category: 'c2', Stock: 5 })];
    expect(related(all[0], all, 2).map((x) => x.fields.Sku)).toEqual(['C', 'B']);
    expect(related(all[3], all, 3).map((x) => x.fields.Sku)).toEqual(['A', 'C', 'B']);
  });
  it('categories: unique, services last', () => {
    expect(categories([p({ Category: 'שירותים' }), p({ Category: 'מסכים' }), p({ Category: 'מסכים' }), p({ Category: 'כבלים' })])).toEqual(['מסכים', 'כבלים', 'שירותים']);
  });
});
