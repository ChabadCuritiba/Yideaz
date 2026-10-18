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

export function createCustomer(c: { name: string; email: string; cpfCnpj: string }) {
  return asaas<{ id: string }>("/customers", { method: "POST", body: { ...c, notificationDisabled: true } });
}

type Payment = { id: string; status: string; invoiceUrl: string; externalReference?: string };

/**
 * Creates a charge the customer pays on Asaas's hosted page (Pix, boleto or card).
 * `successUrl` sends them back after paying; Asaas only accepts it when the site's
 * domain is registered in the Asaas account, so we retry without it if refused.
 */
export async function createPayment(p: {
  customer: string;
  value: number;
  description: string;
  externalReference: string;
  successUrl: string;
}) {
  const due = new Date(Date.now() + 3 * 86400e3).toISOString().slice(0, 10);
  const body = {
    customer: p.customer,
    billingType: "UNDEFINED",
    value: p.value,
    dueDate: due,
    description: p.description.slice(0, 500),
    externalReference: p.externalReference,
  };
  try {
    return await asaas<Payment>("/payments", {
      method: "POST",
      body: { ...body, callback: { successUrl: p.successUrl, autoRedirect: true } },
    });
  } catch (e) {
    if (!(e instanceof AsaasError)) throw e;
    return asaas<Payment>("/payments", { method: "POST", body });
  }
}

/** Checks that the API key works. Returns a short status line. */
export async function checkAsaas() {
  await asaas("/customers?limit=1");
  return `connected (${asaasEnv()})`;
}

export function getPayment(id: string) {
  return asaas<Payment>(`/payments/${encodeURIComponent(id)}`);
}
