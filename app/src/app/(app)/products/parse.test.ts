import { describe, it, expect } from 'vitest';
import { parseProductForm } from './parse';

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe('parseProductForm', () => {
  it('accepts a product and reads the quantity as a number', () => {
    expect(parseProductForm(fd({ Name: 'מטען 65W', Category: 'מטענים', Price: '129', Description: 'מטען GaN', Stock: '12' }))).toEqual({
      ok: true,
      data: { Name: 'מטען 65W', Category: 'מטענים', Price: 129, Description: 'מטען GaN', Stock: 12 },
    });
  });

  it('treats a blank quantity as zero and allows price 0', () => {
    const r = parseProductForm(fd({ Name: 'שירות', Category: 'שירותים', Price: '0', Description: '' }));
    expect(r.ok && r.data.Stock).toBe(0);
    expect(r.ok && r.data.Price).toBe(0);
  });

  it('reports a bad quantity against the Stock field', () => {
    const r = parseProductForm(fd({ Name: 'מטען', Category: 'מטענים', Price: '1', Stock: '3.5' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.Stock).toBe('הכמות חייבת להיות מספר שלם');
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
