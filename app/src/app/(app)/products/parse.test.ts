import { describe, it, expect } from 'vitest';
import { parseProductForm } from './parse';

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe('parseProductForm', () => {
  it('accepts a product and reads the checkbox as boolean', () => {
    expect(parseProductForm(fd({ Name: 'מטען 65W', Category: 'מטענים', Price: '129', Description: 'מטען GaN', InStock: 'on' }))).toEqual({
      ok: true,
      data: { Name: 'מטען 65W', Category: 'מטענים', Price: 129, Description: 'מטען GaN', InStock: true },
    });
  });

  it('treats a missing checkbox as not in stock and allows price 0', () => {
    const r = parseProductForm(fd({ Name: 'שירות', Category: 'שירותים', Price: '0', Description: '' }));
    expect(r.ok && r.data.InStock).toBe(false);
    expect(r.ok && r.data.Price).toBe(0);
  });

  it('rejects an empty name and a negative price', () => {
    const r = parseProductForm(fd({ Name: '', Category: 'x', Price: '-5' }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.Name).toBe('יש להזין שם מוצר');
      expect(r.errors.Price).toBe('המחיר לא יכול להיות שלילי');
    }
  });
});
