"use client";

import { useState } from "react";
import type { CartLine } from "@/components/cart";
import { useFormAction } from "@/components/use-form-action";
import { checkout } from "@/lib/checkout";
import { money } from "@/lib/format";

const METHODS = [
  { value: "pix", label: "Pix", note: "Scan the QR code shown on the next screen. Confirmed instantly." },
  { value: "credit_card", label: "Credit card", note: "Charged right away. Card details go straight to our payment partner Asaas." },
  { value: "debit_card", label: "Debit card", note: "Your bank asks you to confirm the payment on a secure Asaas page, then you come back here." },
] as const;

/** Formats a value as the user types, keeping only digits. */
const mask = (fn: (d: string) => string) => (e: React.ChangeEvent<HTMLInputElement>) => {
  e.target.value = fn(e.target.value.replace(/\D/g, ""));
};
const cardMask = mask((d) => d.slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 "));
const expiryMask = mask((d) => d.slice(0, 4).replace(/(\d{2})(?=\d)/, "$1/"));
const cepMask = mask((d) => d.slice(0, 8).replace(/(\d{5})(?=\d)/, "$1-"));

export function CheckoutForm({ lines, subtotal }: { lines: CartLine[]; subtotal: number }) {
  const [state, onSubmit, pending] = useFormAction(checkout, {});
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("pix");
  const current = METHODS.find((m) => m.value === method)!;

  return (
    <form onSubmit={onSubmit} className="h-fit space-y-3 rounded-2xl border border-line p-6">
      <div className="mb-4 flex justify-between text-lg">
        <span>Total</span>
        <span className="tabular-nums">{money(subtotal)}</span>
      </div>
      <input type="hidden" name="cart" value={JSON.stringify(lines.map(({ productId, quantity }) => ({ productId, quantity })))} />
      <input type="hidden" name="method" value={method} />

      <p className="label pt-2">Your details</p>
      <input name="name" required placeholder="Full name" className="input" autoComplete="name" />
      <input name="email" type="email" required placeholder="Email" className="input" autoComplete="email" />
      <div className="grid grid-cols-2 gap-3">
        <input name="cpfCnpj" required inputMode="numeric" placeholder="CPF or CNPJ" className="input" />
        <input name="phone" required inputMode="tel" placeholder="Phone (DDD)" className="input" autoComplete="tel" />
      </div>
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <input name="postalCode" required inputMode="numeric" placeholder="CEP" className="input" autoComplete="postal-code" onChange={cepMask} />
        <input name="addressNumber" required placeholder="Nº" className="input" />
      </div>
      <input name="address" placeholder="Street, complement, city" className="input" autoComplete="street-address" />

      <p className="label pt-4">Payment</p>
      <div className="grid grid-cols-3 gap-1 rounded-full border border-line p-1 text-sm" role="radiogroup">
        {METHODS.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={method === m.value}
            onClick={() => setMethod(m.value)}
            className={`rounded-full px-2 py-2 transition ${method === m.value ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">{current.note}</p>

      {method === "credit_card" && (
        <div className="space-y-3">
          <input name="cardNumber" required inputMode="numeric" placeholder="Card number" className="input" autoComplete="cc-number" onChange={cardMask} />
          <input name="cardName" required placeholder="Name on card" className="input" autoComplete="cc-name" />
          <div className="grid grid-cols-2 gap-3">
            <input name="cardExpiry" required inputMode="numeric" placeholder="MM/YY" className="input" autoComplete="cc-exp" onChange={expiryMask} />
            <input name="cardCvv" required inputMode="numeric" maxLength={4} placeholder="CVV" className="input" autoComplete="cc-csc" />
          </div>
        </div>
      )}

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>
        {pending ? "Processing…" : method === "pix" ? "Pay with Pix" : method === "credit_card" ? `Pay ${money(subtotal)}` : "Continue to bank confirmation"}
      </button>
      <p className="text-center text-xs text-muted">🔒 Secure payment by Asaas</p>
    </form>
  );
}
