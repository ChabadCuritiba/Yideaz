"use server";

import { redirect } from "next/navigation";
import { asaasEnabled, createCustomer, createPayment } from "./asaas";
import { createOrder, getProductsByIds, setOrderPayment, type OrderItem } from "./db";

export type CheckoutState = { error?: string };

export async function checkout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const address = String(form.get("address") ?? "").trim();
  const cpfCnpj = String(form.get("cpfCnpj") ?? "").replace(/\D/g, "");
  let requested: { productId: string; quantity: number }[];
  try {
    requested = JSON.parse(String(form.get("cart") ?? "[]"));
  } catch {
    return { error: "Your cart could not be read." };
  }
  if (!name || !email.includes("@")) return { error: "Please enter your name and a valid email." };
  if (asaasEnabled() && cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
    return { error: "Please enter a valid CPF or CNPJ." };
  }

  // Prices and stock always come from the database, never from the browser.
  const products = await getProductsByIds(requested.map((r) => String(r.productId)));
  const items: OrderItem[] = [];
  for (const r of requested) {
    const p = products.find((p) => p.id === String(r.productId));
    const quantity = Math.floor(Number(r.quantity));
    if (!p || quantity < 1) continue;
    if (quantity > p.stock) return { error: `Only ${p.stock} left of “${p.name}”.` };
    items.push({ productId: p.id, name: p.name, price_cents: p.price_cents, quantity });
  }
  if (items.length === 0) return { error: "Your cart is empty." };

  const total = items.reduce((n, i) => n + i.price_cents * i.quantity, 0);
  const orderId = await createOrder({ name, email, address, items, total_cents: total });

  if (!asaasEnabled()) redirect(`/checkout/success?order=${orderId}`);

  let invoiceUrl: string;
  try {
    const customer = await createCustomer({ name, email, cpfCnpj });
    const payment = await createPayment({
      customer: customer.id,
      value: total / 100,
      description: `Yideaz order ${orderId.slice(0, 8).toUpperCase()}: ${items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}`,
      externalReference: orderId,
      successUrl: `${process.env.SITE_URL || "http://localhost:3000"}/checkout/success?order=${orderId}`,
    });
    await setOrderPayment(orderId, payment.id);
    invoiceUrl = payment.invoiceUrl;
  } catch (e) {
    console.error("Asaas checkout failed", e);
    return { error: (e as Error).message || "Payment could not be started. Please try again." };
  }
  redirect(invoiceUrl);
}
