"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { productId: number; name: string; price_cents: number; image_url: string; quantity: number };

type Cart = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<Cart | null>(null);
const KEY = "yideaz-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
      if (saved) setLines(JSON.parse(saved));
    } catch {}
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const value = useMemo<Cart>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.quantity * l.price_cents, 0),
      add: (line, qty = 1) => {
        const existing = lines.find((l) => l.productId === line.productId);
        persist(
          existing
            ? lines.map((l) => (l.productId === line.productId ? { ...l, quantity: l.quantity + qty } : l))
            : [...lines, { ...line, quantity: qty }],
        );
      },
      setQty: (productId, qty) =>
        persist(
          qty <= 0
            ? lines.filter((l) => l.productId !== productId)
            : lines.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l)),
        ),
      clear: () => persist([]),
    }),
    [lines, persist],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider");
  return cart;
}
