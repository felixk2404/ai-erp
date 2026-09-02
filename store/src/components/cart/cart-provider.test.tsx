// @vitest-environment jsdom
import { StrictMode, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CartProvider, useCart } from './cart-provider';
import { MAX_LINES, MAX_QTY, type CartLine } from '@/lib/cart';

const STORAGE_KEY = 'aie-cart-v1';

const line = (sku: string, qty = 1): CartLine => ({ sku, name: sku, price: 10, qty, service: false });

function Consumer() {
  const { totals, ready, add } = useCart();
  return (
    <div>
      <span data-testid="ready">{String(ready)}</span>
      <span data-testid="count">{totals.count}</span>
      <button onClick={() => add({ sku: 'A', name: 'A', price: 10, qty: 1, service: false })}>add</button>
    </div>
  );
}

/**
 * `add` מדווח מה קרה בפועל, כי הרדיוסר מסרב בשקט: בלי הערך הזה לחיצה על
 * "הוסף לסל" בעגלה מלאה לא משנה כלום על המסך ונראית כמו כפתור שבור.
 */
function Reporter() {
  const { add, ready } = useCart();
  const [log, setLog] = useState<string[]>([]);
  return (
    <div>
      <span data-testid="ready">{String(ready)}</span>
      <span data-testid="log">{log.join(',')}</span>
      <button onClick={() => setLog((l) => [...l, add(line('A'))])}>same</button>
      <button onClick={() => setLog((l) => [...l, add(line(`S${l.length}`))])}>fresh</button>
      <button onClick={() => setLog((l) => [...l, add(line('A', MAX_QTY))])}>max</button>
    </div>
  );
}

const logOf = () => screen.getByTestId('log').textContent;

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('CartProvider', () => {
  it('throws when useCart is used outside the provider', () => {
    expect(() => render(<Consumer />)).toThrow(/useCart must be used within/);
  });

  it('adds a line and persists it to localStorage', async () => {
    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );
    await screen.findByText('true'); // wait for ready
    fireEvent.click(screen.getByText('add'));
    expect(await screen.findByTestId('count')).toHaveProperty('textContent', '1');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(stored.lines).toHaveLength(1);
    expect(stored.lines[0]).toMatchObject({ sku: 'A', qty: 1 });
  });

  it('hydrates from pre-seeded localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines: [{ sku: 'B', name: 'B', price: 5, qty: 2, service: false }] }));
    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );
    await screen.findByText('true'); // wait for ready
    expect(screen.getByTestId('count').textContent).toBe('2');
  });

  it('add מדווח added / merged', async () => {
    render(
      <CartProvider>
        <Reporter />
      </CartProvider>
    );
    fireEvent.click(screen.getByText('same'));
    fireEvent.click(screen.getByText('same'));
    expect(logOf()).toBe('added,merged');
  });

  it('add מדווח max-lines כשהעגלה מלאה, ולא מוסיף שורה', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lines: Array.from({ length: MAX_LINES }, (_, i) => line(`X${i}`)) })
    );
    render(
      <CartProvider>
        <Reporter />
      </CartProvider>
    );
    // ממתינים להידרציה: לפניה העגלה ריקה וההוספה הייתה מצליחה.
    await screen.findByText('true');
    fireEvent.click(screen.getByText('fresh'));
    expect(logOf()).toBe('max-lines');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').lines).toHaveLength(MAX_LINES);
  });

  it('add מדווח max-qty כששורה קיימת כבר בתקרה', async () => {
    render(
      <CartProvider>
        <Reporter />
      </CartProvider>
    );
    fireEvent.click(screen.getByText('max'));
    fireEvent.click(screen.getByText('same'));
    expect(logOf()).toBe('added,max-qty');
  });

  it('hydration is idempotent under StrictMode double-invoked effects', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines: [{ sku: 'A', name: 'A', price: 10, qty: 2, service: false }] }));
    render(
      <StrictMode>
        <CartProvider>
          <Consumer />
        </CartProvider>
      </StrictMode>
    );
    await screen.findByText('true'); // wait for ready
    expect(screen.getByTestId('count').textContent).toBe('2'); // not 4

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(stored.lines[0].qty).toBe(2);
  });
});
