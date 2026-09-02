// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CartProvider, useCart } from './cart-provider';

const STORAGE_KEY = 'aie-cart-v1';

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
});
