import { describe, expect, it } from 'vitest';
import { FLAGSHIP_PREFERENCE, featuredOf, flagshipOf, statsOf } from './home';
import type { Product } from './types';

const p = (
  sku: string,
  Category: string,
  Price: number,
  { Stock = 5, ImageUrl = `https://x/${sku}.webp` }: { Stock?: number; ImageUrl?: string } = {},
): Product => ({ id: sku, createdTime: '', fields: { Name: sku, Sku: sku, Category, Price, Stock, ImageUrl } });

describe('flagshipOf', () => {
  it('מעדיף את הרשימה על פני המחיר', () => {
    const all = [p('TY-MN-27Q', 'מסכים', 1290), p('TY-HP-200', 'אוזניות', 349)];
    expect(flagshipOf(all)?.fields.Sku).toBe(FLAGSHIP_PREFERENCE[0]);
  });

  it('מדלג על מועדף שאזל או בלי תמונה, וממשיך ברשימה', () => {
    const all = [
      p('TY-HP-200', 'אוזניות', 349, { Stock: 0 }),
      p('TY-GH-700', 'אוזניות', 429, { ImageUrl: '' }),
      p('TY-MN-27Q', 'מסכים', 1290),
    ];
    expect(flagshipOf(all)?.fields.Sku).toBe('TY-MN-27Q');
  });

  it('בלי מועדף זמין — היקר ביותר שבמלאי, ולעולם לא שירות', () => {
    const all = [p('TY-SD-1TB', 'אחסון', 399), p('TY-SRV-09', 'שירותים', 1290, { Stock: 0 })];
    expect(flagshipOf(all)?.fields.Sku).toBe('TY-SD-1TB');
    expect(flagshipOf([p('TY-SRV-09', 'שירותים', 1290, { Stock: 0 })])).toBeUndefined();
  });
});

describe('featuredOf', () => {
  const all = [
    p('A1', 'מסכים', 900),
    p('A2', 'מסכים', 800),
    p('A3', 'מסכים', 700),
    p('B1', 'אוזניות', 400),
    p('C1', 'עכברים', 200),
    p('S1', 'שירותים', 999),
    p('D1', 'כבלים', 50, { Stock: 0 }),
  ];

  it('קטגוריה אחת קודם, ואז השלמה מהיקרים שנותרו', () => {
    expect(featuredOf(all).map((x) => x.fields.Sku)).toEqual(['A1', 'B1', 'C1', 'A2', 'A3']);
  });

  it('מחריג את הדגל ולא חורג מ-n', () => {
    const out = featuredOf(all, all[0], 3);
    expect(out.map((x) => x.fields.Sku)).toEqual(['A2', 'B1', 'C1']);
  });
});

describe('statsOf', () => {
  it('סופר, מוצא מחיר פתיחה, ודוחף שירותים לסוף', () => {
    const all = [p('S1', 'שירותים', 99), p('A1', 'מסכים', 900), p('A2', 'מסכים', 690, { Stock: 0 })];
    expect(statsOf(all)).toEqual([
      { name: 'מסכים', count: 2, from: 690 },
      { name: 'שירותים', count: 1, from: 99 },
    ]);
  });
});
