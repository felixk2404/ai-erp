import { describe, it, expect } from 'vitest';
import { parseItems, itemCount } from './order-items';

const RAW = '[{"sku":"TY-HP-200","name":"אוזניות אלחוטיות TY-200","qty":1,"price":349},{"sku":"TY-CB-UC100","name":"כבל USB-C 100W באורך 2 מטר","qty":2,"price":45}]';

describe('parseItems (הזמנות)', () => {
  it('parses the JSON WF10 writes into Orders.Items', () => {
    expect(parseItems(RAW)).toEqual([
      { sku: 'TY-HP-200', name: 'אוזניות אלחוטיות TY-200', qty: 1, price: 349 },
      { sku: 'TY-CB-UC100', name: 'כבל USB-C 100W באורך 2 מטר', qty: 2, price: 45 },
    ]);
  });

  // עמוד ההזמנה חייב לעלות גם על רשומה פגומה — JSON חתוך הוא "בלי שורות", לא 500.
  it('returns an empty list for malformed json, a wrong shape, or nothing at all', () => {
    expect(parseItems('[{"sku":"TY-HP-200"')).toEqual([]);
    expect(parseItems('[{"sku":"TY-HP-200","name":"אוזניות","qty":0,"price":349}]')).toEqual([]);
    expect(parseItems('{}')).toEqual([]);
    expect(parseItems('')).toEqual([]);
    expect(parseItems(undefined)).toEqual([]);
  });
});

describe('itemCount', () => {
  it('sums the quantities, not the rows', () => {
    expect(itemCount(parseItems(RAW))).toBe(3);
  });

  it('is 0 for an order with no items', () => {
    expect(itemCount([])).toBe(0);
  });
});
