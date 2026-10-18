"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart, type CartLine } from "@/components/cart";

export function AddToCart({ product, max }: { product: Omit<CartLine, "quantity">; max: number }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-full border border-line">
        <button type="button" className="px-4 py-2.5" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
        <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
        <button type="button" className="px-4 py-2.5" onClick={() => setQty(Math.min(max, qty + 1))} aria-label="Increase">+</button>
      </div>
      <button
        type="button"
        className="btn"
        onClick={() => {
          add(product, qty);
          setAdded(true);
        }}
      >
        Add to cart
      </button>
      {added && <Link href="/cart" className="text-sm text-muted underline-offset-4 hover:underline">Added — view cart →</Link>}
    </div>
  );
}
