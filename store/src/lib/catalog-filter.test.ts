import { describe, it, expect } from 'vitest';
import {
  SERVICE,
  catalogQuery,
  filterProducts,
  highlights,
  inStock,
  isService,
  parseCatalogParams,
  gridPlan,
  pickLead,
} from './catalog-filter';
import * as server from './catalog';
import type { Product } from './types';

const p = (fields: Partial<Product['fields']> & { Name: string }): Product => ({
  id: fields.Sku ?? fields.Name,
  createdTime: '',
  fields,
});

const all = [
  p({ Name: 'כבל HDMI 2.1', Sku: 'CB-HDMI-21', Category: 'כבלים', Price: 89, Description: 'תומך 4K 120Hz' }),
  p({ Name: 'מסך גיימינג 27"', Sku: 'MN-G27', Category: 'מסכים', Price: 1180, Description: 'רזולוציית QHD' }),
  p({ Name: 'עכבר אלחוטי', Sku: 'MS-W1', Category: 'היקפי', Price: 149 }),
  p({ Name: 'התקנה בבית הלקוח', Sku: 'SV-INSTALL', Category: 'שירותים', Price: 349 }),
];
const skus = (list: Product[]) => list.map((x) => x.fields.Sku);

describe('filterProducts', () => {
  it('ללא סינון — מחזיר הכל, ממוין לפי שם', () => {
    expect(skus(filterProducts(all))).toEqual(['SV-INSTALL', 'CB-HDMI-21', 'MN-G27', 'MS-W1']);
  });

  it('קטגוריה — התאמה מדויקת בלבד', () => {
    expect(skus(filterProducts(all, { c: 'כבלים' }))).toEqual(['CB-HDMI-21']);
    expect(filterProducts(all, { c: 'כב' })).toEqual([]);
    expect(filterProducts(all, { c: '' })).toHaveLength(4);
  });

  it('חיפוש — שם, מק"ט ותיאור, בלי תלות ברישיות', () => {
    expect(skus(filterProducts(all, { q: 'hdmi' }))).toEqual(['CB-HDMI-21']);
    expect(skus(filterProducts(all, { q: 'MN-g' }))).toEqual(['MN-G27']);
    expect(skus(filterProducts(all, { q: 'עכבר' }))).toEqual(['MS-W1']);
    expect(skus(filterProducts(all, { q: '  qhd  ' }))).toEqual(['MN-G27']);
    expect(filterProducts(all, { q: 'אין דבר כזה' })).toEqual([]);
  });

  it('קטגוריה וחיפוש פועלים יחד', () => {
    expect(filterProducts(all, { c: 'מסכים', q: 'hdmi' })).toEqual([]);
    expect(skus(filterProducts(all, { c: 'מסכים', q: 'qhd' }))).toEqual(['MN-G27']);
  });

  it('מיון לפי מחיר, עולה ויורד', () => {
    expect(skus(filterProducts(all, { sort: 'price-asc' }))).toEqual(['CB-HDMI-21', 'MS-W1', 'SV-INSTALL', 'MN-G27']);
    expect(skus(filterProducts(all, { sort: 'price-desc' }))).toEqual(['MN-G27', 'SV-INSTALL', 'MS-W1', 'CB-HDMI-21']);
  });

  it('מוצר בלי מחיר נספר כאפס ולא מפיל את המיון', () => {
    const list = [...all, p({ Name: 'אביזר', Sku: 'X-0' })];
    expect(skus(filterProducts(list, { sort: 'price-asc' }))[0]).toBe('X-0');
  });

  it('לא משנה את המערך המקורי', () => {
    const before = skus(all);
    filterProducts(all, { sort: 'price-desc' });
    expect(skus(all)).toEqual(before);
  });
});

describe('parseCatalogParams', () => {
  it('ברירות מחדל כשאין פרמטרים', () => {
    expect(parseCatalogParams({})).toEqual({ c: '', q: '', sort: 'name', view: 'grid' });
  });

  it('קורא ערכים תקינים ומקצץ רווחים', () => {
    expect(parseCatalogParams({ c: ' כבלים ', q: ' hdmi ', sort: 'price-desc', view: 'spec' })).toEqual({
      c: 'כבלים',
      q: 'hdmi',
      sort: 'price-desc',
      view: 'spec',
    });
  });

  it('ערך זר נופל לברירת המחדל', () => {
    expect(parseCatalogParams({ sort: 'drop-table', view: 'kanban' })).toMatchObject({ sort: 'name', view: 'grid' });
  });

  it('פרמטר כפול — לוקח את הראשון', () => {
    expect(parseCatalogParams({ c: ['מסכים', 'כבלים'], sort: ['price-asc'] })).toMatchObject({ c: 'מסכים', sort: 'price-asc' });
  });
});

describe('catalogQuery', () => {
  it('ברירות מחדל נשמטות', () => {
    expect(catalogQuery({ c: '', q: '', sort: 'name', view: 'grid' })).toBe('');
  });

  it('סדר קבוע לכל הפרמטרים', () => {
    expect(catalogQuery({ c: 'כבלים', q: 'hdmi', sort: 'price-asc', view: 'spec' })).toBe(
      `c=${encodeURIComponent('כבלים')}&q=hdmi&sort=price-asc&view=spec`,
    );
  });
});

// הפרדיקטים כפולים בכוונה (catalog.ts מושך server-only ולכן אסור בצד לקוח).
// הבדיקה הזו היא המנעול שמונע מהם להתפצל.
describe('parity מול catalog.ts', () => {
  const cases = [
    p({ Name: 'שירות', Category: 'שירותים' }),
    p({ Name: 'אזל', Category: 'כבלים', Stock: 0 }),
    p({ Name: 'יש', Category: 'כבלים', Stock: 3 }),
    p({ Name: 'בלי שדה', Category: 'כבלים' }),
    p({ Name: 'מפרט', Highlights: ' a \n\n b \nc\nd ' }),
  ];

  it('isService / inStock / highlights מתנהגים זהה', () => {
    expect(SERVICE).toBe(server.SERVICE);
    for (const x of cases) {
      expect(isService(x)).toBe(server.isService(x));
      expect(inStock(x)).toBe(server.inStock(x));
      expect(highlights(x)).toEqual(server.highlights(x));
    }
  });
});

describe('gridPlan', () => {
  it('מספר העמודות לא עולה על מספר התוצאות', () => {
    expect(gridPlan(1).columns).toBe('grid-cols-1');
    expect(gridPlan(2).columns).toBe('grid-cols-1 sm:grid-cols-2');
    expect(gridPlan(3).columns).toBe('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3');
    expect(gridPlan(4).columns).toBe('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
    expect(gridPlan(34).columns).toBe('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
  });

  it('כרטיס מוביל רק מ-4 תוצאות ומעלה', () => {
    for (const n of [0, 1, 2, 3]) expect(gridPlan(n).lead).toBe(false);
    for (const n of [4, 5, 34]) expect(gridPlan(n).lead).toBe(true);
  });
});

describe('pickLead', () => {
  const lead = [
    p({ Name: 'שירות יקר', Sku: 'SV', Category: 'שירותים', Price: 9999, ImageUrl: 'x' }),
    p({ Name: 'אזל ויקר', Sku: 'OUT', Category: 'מסכים', Price: 5000, Stock: 0, ImageUrl: 'x' }),
    p({ Name: 'בלי תמונה', Sku: 'NOIMG', Category: 'מסכים', Price: 4000, Stock: 2 }),
    p({ Name: 'מסך יקר', Sku: 'BIG', Category: 'מסכים', Price: 1290, Stock: 2, ImageUrl: 'x' }),
    p({ Name: 'כבל זול', Sku: 'CHEAP', Category: 'כבלים', Price: 45, Stock: 9, ImageUrl: 'x' }),
  ];

  it('היקר שבמוצרים הפיזיים שבמלאי ועם תמונה', () => {
    expect(pickLead(lead)?.fields.Sku).toBe('BIG');
  });

  it('שירותים, אזל ובלי תמונה לא נבחרים', () => {
    for (const sku of ['SV', 'OUT', 'NOIMG']) {
      expect(pickLead(lead)?.fields.Sku).not.toBe(sku);
    }
  });

  it('כשאין מועמד — הפריט הראשון', () => {
    const onlyServices = [p({ Name: 'א', Sku: 'S1', Category: 'שירותים', Price: 10 }), p({ Name: 'ב', Sku: 'S2', Category: 'שירותים', Price: 20 })];
    expect(pickLead(onlyServices)?.fields.Sku).toBe('S1');
    expect(pickLead([])).toBeNull();
  });
});
