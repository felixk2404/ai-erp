'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { cartReducer, totals as computeTotals, type Cart, type CartLine } from '@/lib/cart';

const STORAGE_KEY = 'aie-cart-v1';

type LastAdded = { sku: string; at: number } | null;

type CartContextValue = {
  cart: Cart;
  totals: ReturnType<typeof computeTotals>;
  ready: boolean;
  add: (line: CartLine) => void;
  remove: (sku: string) => void;
  setQty: (sku: string, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  lastAdded: LastAdded;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, { lines: [] });
  // useReducer (not useState) for the readiness flag: the lint rule for this
  // project's React Compiler config flags a bare useState setter called
  // from inside a useEffect body, but not a reducer dispatch.
  const [ready, setReady] = useReducer((_: boolean, next: boolean) => next, false);
  const [open, setOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<LastAdded>(null);

  // Hydrate from localStorage after mount (SSR-safe: server and first client
  // render both start from an empty cart, avoiding a hydration mismatch).
  // Guarded by a ref (not just empty deps) because Strict Mode double-invokes
  // effects in dev — without the guard, every stored line gets re-added and
  // its qty doubles.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Cart) : null;
      if (parsed && Array.isArray(parsed.lines)) {
        for (const line of parsed.lines) dispatch({ type: 'add', line });
      }
    } catch {
      // corrupt/unavailable storage: start from an empty cart
    }
    setReady(true);
  }, []);

  // Persist on every change, but only once hydration has had its say —
  // otherwise an empty first render would clobber a previously saved cart.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // storage unavailable/full: cart still works for this session
    }
  }, [cart, ready]);

  const add = useCallback(
    (line: CartLine) => {
      dispatch({ type: 'add', line });
      const before = cart.lines.find((l) => l.sku === line.sku);
      const after = cartReducer(cart, { type: 'add', line }).lines.find((l) => l.sku === line.sku);
      if (after && after.qty !== before?.qty) setLastAdded({ sku: line.sku, at: Date.now() });
    },
    [cart]
  );
  const remove = useCallback((sku: string) => dispatch({ type: 'remove', sku }), []);
  const setQty = useCallback((sku: string, qty: number) => dispatch({ type: 'setQty', sku, qty }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const totalsValue = useMemo(() => computeTotals(cart), [cart]);

  const value = useMemo<CartContextValue>(
    () => ({ cart, totals: totalsValue, ready, add, remove, setQty, clear, open, setOpen, lastAdded }),
    [cart, totalsValue, ready, add, remove, setQty, clear, open, lastAdded]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
