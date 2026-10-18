"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  AsaasError,
  asaasEnabled,
  createCardPayment,
  createCustomer,
  createDebitPayment,
  createPixPayment,
  PAID_STATUSES,
} from "./asaas";
import { createOrder, getProductsByIds, markOrderPaid, setOrderPayment, setOrderStatus, type OrderItem } from "./db";

export type CheckoutState = { error?: string };

const METHODS = ["pix", "credit_card", "debit_card"] as const;
type Method = (typeof METHODS)[number];

const digits = (v: FormDataEntryValue | null) => String(v ?? "").replace(/\D/g, "");
const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();

export async function checkout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const name = text(form.get("name"));
  const email = text(form.get("email"));
  const phone = digits(form.get("phone"));
  const cpfCnpj = digits(form.get("cpfCnpj"));
  const postalCode = digits(form.get("postalCode"));
  const addressNumber = text(form.get("addressNumber"));
  const street = text(form.get("address"));
  const method = (METHODS as readonly string[]).includes(text(form.get("method")))
    ? (text(form.get("method")) as Method)
    : "pix";

  let requested: { productId: string; quantity: number }[];
  try {
    requested = JSON.parse(String(form.get("cart") ?? "[]"));
  } catch {
    return { error: "Your cart could not be read." };
  }
  if (!name || !email.includes("@")) return { error: "Please enter your name and a valid email." };
  if (asaasEnabled()) {
    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) return { error: "Please enter a valid CPF or CNPJ." };
    if (phone.length < 10) return { error: "Please enter your phone number with area code." };
    if (postalCode.length !== 8 || !addressNumber) return { error: "Please enter your CEP and house number." };
  }

  // Card details are only read here and passed to Asaas; never stored or logged.
  const card =
    method === "credit_card"
      ? {
          holderName: text(form.get("cardName")),
          number: digits(form.get("cardNumber")),
          expiryMonth: digits(form.get("cardExpiry")).slice(0, 2),
          expiryYear: "20" + digits(form.get("cardExpiry")).slice(2, 4),
          ccv: digits(form.get("cardCvv")),
        }
      : null;
  if (card && (!card.holderName || card.number.length < 13 || card.expiryYear.length !== 4 || card.ccv.length < 3)) {
    return { error: "Please check the card details." };
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
  const address = [street, addressNumber, postalCode && `CEP ${postalCode.replace(/(\d{5})(\d{3})/, "$1-$2")}`]
    .filter(Boolean)
    .join(", ");
  const orderId = await createOrder({ name, email, phone, address, items, total_cents: total, payment_method: method });

  if (!asaasEnabled()) redirect(`/checkout/success?order=${orderId}`);

  const h = await headers();
  const site = process.env.SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const remoteIp = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "127.0.0.1";

  let next: string;
  try {
    const customer = await createCustomer({ name, email, cpfCnpj, mobilePhone: phone, postalCode, addressNumber });
    const charge = {
      customer: customer.id,
      value: total / 100,
      description: `Yideaz order ${orderId.slice(0, 8).toUpperCase()}: ${items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}`,
      externalReference: orderId,
    };

    if (method === "pix") {
      const payment = await createPixPayment(charge);
      await setOrderPayment(orderId, payment.id);
      next = `/checkout/pay/${orderId}`;
    } else if (method === "credit_card") {
      const payment = await createCardPayment(charge, card!, { name, email, cpfCnpj, postalCode, addressNumber, phone }, remoteIp);
      await setOrderPayment(orderId, payment.id);
      if (PAID_STATUSES.includes(payment.status)) await markOrderPaid(orderId);
      next = `/checkout/success?order=${orderId}`;
    } else {
      const payment = await createDebitPayment(charge, `${site}/checkout/success?order=${orderId}`);
      await setOrderPayment(orderId, payment.id);
      next = payment.invoiceUrl;
    }
  } catch (e) {
    // Don't leave failed attempts looking like open orders.
    await setOrderStatus(orderId, "cancelled").catch(() => {});
    console.error("Asaas checkout failed:", (e as Error).message);
    if (e instanceof AsaasError) {
      return { error: method === "credit_card" ? `Card not approved: ${e.message}` : e.message };
    }
    return { error: "Payment could not be started. Please try again." };
  }
  redirect(next);
}
