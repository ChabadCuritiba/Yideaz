import "server-only";

// Asaas API v3: https://docs.asaas.com
const BASE =
  process.env.ASAAS_BASE_URL ||
  (process.env.ASAAS_ENV === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3");

export const asaasEnabled = () => !!process.env.ASAAS_API_KEY;

/** Statuses that mean the money came in. */
export const PAID_STATUSES = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];

export class AsaasError extends Error {}

async function asaas<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(BASE + path, {
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

/** Checks the API key against the configured environment. Returns a short status line. */
export async function checkAsaas() {
  const key = process.env.ASAAS_API_KEY ?? "";
  const env = process.env.ASAAS_ENV === "production" ? "production" : "sandbox";
  // Asaas keys are marked _prod_ (live) or _hmlg_ (sandbox).
  if (env === "sandbox" && key.includes("_prod_")) {
    throw new AsaasError("This is a production Asaas key but ASAAS_ENV is “sandbox”. Set ASAAS_ENV to “production” in apphosting.yaml.");
  }
  if (env === "production" && key.includes("_hmlg_")) {
    throw new AsaasError("This is a sandbox Asaas key but ASAAS_ENV is “production”. Set ASAAS_ENV to “sandbox” in apphosting.yaml.");
  }
  await asaas("/customers?limit=1");
  return `connected (${env})`;
}

export function getPayment(id: string) {
  return asaas<Payment>(`/payments/${encodeURIComponent(id)}`);
}
