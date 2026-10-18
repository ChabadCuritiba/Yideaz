/* eslint-disable @next/next/no-img-element -- uploaded media */
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useCart } from "@/components/cart";
import { checkout } from "@/lib/checkout";
import { money } from "@/lib/format";

export default function CartPage() {
  const { lines, subtotal, setQty } = useCart();
  const [state, action, pending] = useActionState(checkout, {});

  if (lines.length === 0) {
    return (
      <div className="container-x pt-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tighter">Your cart is empty.</h1>
        <Link href="/shop" className="btn mt-8">Browse the shop</Link>
      </div>
    );
  }

  return (
    <div className="container-x pt-16">
      <p className="label">Cart</p>
      <h1 className="mt-4 mb-12 text-4xl font-semibold tracking-tighter sm:text-6xl">Almost yours.</h1>
      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <ul className="self-start divide-y divide-line border-y border-line">
          {lines.map((l) => (
            <li key={l.productId} className="flex items-center gap-4 py-5">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                {l.image_url && <img src={l.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1">
                <Link href={`/shop/${l.productId}`} className="font-medium">{l.name}</Link>
                <p className="text-sm text-muted">{money(l.price_cents)}</p>
              </div>
              <div className="flex items-center rounded-full border border-line text-sm">
                <button type="button" className="px-3 py-1.5" onClick={() => setQty(l.productId, l.quantity - 1)} aria-label="Decrease">−</button>
                <span className="w-5 text-center tabular-nums">{l.quantity}</span>
                <button type="button" className="px-3 py-1.5" onClick={() => setQty(l.productId, l.quantity + 1)} aria-label="Increase">+</button>
              </div>
              <p className="w-20 text-right text-sm tabular-nums">{money(l.price_cents * l.quantity)}</p>
            </li>
          ))}
        </ul>

        <form action={action} className="h-fit space-y-3 rounded-2xl border border-line p-6">
          <div className="mb-4 flex justify-between text-lg">
            <span>Subtotal</span>
            <span className="tabular-nums">{money(subtotal)}</span>
          </div>
          <input type="hidden" name="cart" value={JSON.stringify(lines.map(({ productId, quantity }) => ({ productId, quantity })))} />
          <input name="name" required placeholder="Full name" className="input" autoComplete="name" />
          <input name="email" type="email" required placeholder="Email" className="input" autoComplete="email" />
          <textarea name="address" rows={3} placeholder="Shipping address" className="input resize-none" autoComplete="street-address" />
          {state.error && <p className="text-sm text-red-500">{state.error}</p>}
          <button className="btn w-full" disabled={pending}>{pending ? "Processing…" : "Checkout"}</button>
        </form>
      </div>
    </div>
  );
}
