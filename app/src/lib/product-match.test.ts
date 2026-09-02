import { describe, it, expect } from 'vitest';
import { matchProducts } from './product-match';
import type { Product } from './types';

const p = (id: string, Name: string, Sku: string): Product => ({ id, createdTime: '', fields: { Name, Sku, Price: 1 } });
const products = [p('a', 'אוזניות אלחוטיות TY-200', 'TY-HP-200'), p('b', 'אוזניות תוך-אוזן TY-Buds Pro', 'TY-EB-300'), p('c', 'מטען קיר GaN 65W', 'TY-CH-65'), p('d', 'כבל HDMI 2.1 באורך 2 מטר', 'TY-CB-HD21')];

describe('matchProducts', () => {
  it('finds products mentioned by name, model or sku, case-insensitive, max 3, in order of appearance', () => {
    const reply = 'יש לנו את TY-200 ב-349 ₪ ואת ה-ty-buds pro ב-289 ₪. גם מטען קיר GaN 65W זמין.';
    expect(matchProducts(reply, products).map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });
  it('matches by sku and ignores unrelated text', () => {
    expect(matchProducts('המק"ט TY-CB-HD21 במלאי', products).map((x) => x.id)).toEqual(['d']);
    expect(matchProducts('מדיניות ההחזרות היא 14 יום', products)).toEqual([]);
  });
});
