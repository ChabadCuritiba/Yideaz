"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { createOrder, getProductsByIds, setOrderStripeSession, type OrderItem } from "./db";
import { CURRENCY } from "./format";

export type CheckoutState = { error?: string };

export async function checkout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const address = String(form.get("address") ?? "").trim();
  let requested: { productId: number; quantity: number }[];
  try {
    requested = JSON.parse(String(form.get("cart") ?? "[]"));
  } catch {
    return { error: "Your cart could not be read." };
  }
  if (!name || !email.includes("@")) return { error: "Please enter your name and a valid email." };

  // Prices and stock always come from the database, never from the browser.
  const products = getProductsByIds(requested.map((r) => Number(r.productId)));
  const items: OrderItem[] = [];
  for (const r of requested) {
    const p = products.find((p) => p.id === Number(r.productId));
    const quantity = Math.floor(Number(r.quantity));
    if (!p || quantity < 1) continue;
    if (quantity > p.stock) return { error: `Only ${p.stock} left of “${p.name}”.` };
    items.push({ productId: p.id, name: p.name, price_cents: p.price_cents, quantity });
  }
  if (items.length === 0) return { error: "Your cart is empty." };

  const total = items.reduce((n, i) => n + i.price_cents * i.quantity, 0);
  const orderId = createOrder({ name, email, address, items, total_cents: total });

  if (!process.env.STRIPE_SECRET_KEY) redirect(`/checkout/success?order=${orderId}`);

  const site = process.env.SITE_URL || "http://localhost:3000";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    client_reference_id: String(orderId),
    metadata: { orderId: String(orderId) },
    line_items: items.map((i) => ({
      quantity: i.quantity,
      price_data: { currency: CURRENCY.toLowerCase(), unit_amount: i.price_cents, product_data: { name: i.name } },
    })),
    success_url: `${site}/checkout/success?order=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/cart`,
  });
  setOrderStripeSession(orderId, session.id);
  redirect(session.url!);
}
