import "server-only";

// Asaas API v3: https://docs.asaas.com
const URLS = { production: "https://api.asaas.com/v3", sandbox: "https://api-sandbox.asaas.com/v3" };
type Env = keyof typeof URLS;

/**
 * Which Asaas environment the key belongs to. Keys are marked _prod_ (live) or
 * _hmlg_ (sandbox); older keys without a marker fall back to ASAAS_ENV, and
 * switch automatically if Asaas says the key belongs to the other one.
 */
let detectedEnv: Env | undefined;
function asaasEnv(): Env {
  const key = process.env.ASAAS_API_KEY ?? "";
  if (key.includes("_prod_")) return "production";
  if (key.includes("_hmlg_")) return "sandbox";
  return detectedEnv ?? (process.env.ASAAS_ENV === "production" ? "production" : "sandbox");
}
const baseUrl = () => process.env.ASAAS_BASE_URL || URLS[asaasEnv()];

export const asaasEnabled = () => !!process.env.ASAAS_API_KEY;

/** Statuses that mean the money came in. */
export const PAID_STATUSES = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];

export class AsaasError extends Error {}

async function asaas<T>(path: string, init?: { method?: string; body?: unknown }, retried = false): Promise<T> {
  const res = await fetch(baseUrl() + path, {
    method: init?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "yideaz",
      access_token: process.env.ASAAS_API_KEY!,
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errors = (data.errors ?? []) as { code?: string; description?: string }[];
    // "A chave de API informada não pertence a este ambiente": try the other environment once.
    if (!retried && !process.env.ASAAS_BASE_URL && errors.some((e) => /ambiente/i.test(e.description ?? ""))) {
      detectedEnv = asaasEnv() === "production" ? "sandbox" : "production";
      return asaas<T>(path, init, true);
    }
    throw new AsaasError(errors.map((e) => e.description).join(" ") || `Asaas request failed (${res.status})`);
  }
  return data as T;
}

export function createCustomer(c: {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
  postalCode?: string;
  addressNumber?: string;
}) {
  return asaas<{ id: string }>("/customers", { method: "POST", body: { ...c, notificationDisabled: true } });
}

type Payment = { id: string; status: string; invoiceUrl: string; externalReference?: string };

type Charge = { customer: string; value: number; description: string; externalReference: string };

/** Today's date in Brazil (YYYY-MM-DD), offset by `days`. */
function dueDate(days = 0) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(Date.now() + days * 86400e3);
}

const chargeBody = (c: Charge, billingType: string, days: number) => ({
  customer: c.customer,
  billingType,
  value: c.value,
  dueDate: dueDate(days),
  description: c.description.slice(0, 500),
  externalReference: c.externalReference,
});

/** Pix charge; show it on the site with getPixQrCode. */
export function createPixPayment(c: Charge) {
  return asaas<Payment>("/payments", { method: "POST", body: chargeBody(c, "PIX", 1) });
}

export function getPixQrCode(paymentId: string) {
  return asaas<{ encodedImage: string; payload: string; expirationDate?: string }>(
    `/payments/${encodeURIComponent(paymentId)}/pixQrCode`,
  );
}

export type CardInput = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

export type CardHolder = {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
};

/**
 * Charges a credit card straight away. Card details go to Asaas and are never
 * stored or logged here. Throws AsaasError with Asaas's reason if declined.
 */
export function createCardPayment(c: Charge, card: CardInput, holder: CardHolder, remoteIp: string) {
  return asaas<Payment>("/payments", {
    method: "POST",
    body: { ...chargeBody(c, "CREDIT_CARD", 0), creditCard: card, creditCardHolderInfo: holder, remoteIp },
  });
}

/**
 * Debit cards need the bank's own confirmation (3-D Secure), which happens on
 * Asaas's secure page. `successUrl` brings the customer back afterwards; Asaas
 * only accepts it when the site's domain is registered in the Asaas account.
 */
export async function createDebitPayment(c: Charge, successUrl: string) {
  const attempts = [
    { ...chargeBody(c, "DEBIT_CARD", 0), callback: { successUrl, autoRedirect: true } },
    chargeBody(c, "DEBIT_CARD", 0),
    // Accounts without direct debit-card charges: let the customer pick debit on the page.
    { ...chargeBody(c, "UNDEFINED", 0), callback: { successUrl, autoRedirect: true } },
    chargeBody(c, "UNDEFINED", 0),
  ];
  let lastError: unknown;
  for (const body of attempts) {
    try {
      return await asaas<Payment>("/payments", { method: "POST", body });
    } catch (e) {
      if (!(e instanceof AsaasError)) throw e;
      lastError = e;
    }
  }
  throw lastError;
}

/** Checks that the API key works. Returns a short status line. */
export async function checkAsaas() {
  await asaas("/customers?limit=1");
  return `connected (${asaasEnv()})`;
}

export function getPayment(id: string) {
  return asaas<Payment>(`/payments/${encodeURIComponent(id)}`);
}
