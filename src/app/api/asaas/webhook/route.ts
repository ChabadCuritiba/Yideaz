import { timingSafeEqual } from "node:crypto";
import { markOrderPaid } from "@/lib/db";

const PAID_EVENTS = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"];

function validToken(received: string | null) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// In Asaas: Integrations > Webhooks, point a webhook here and set the same
// auth token as ASAAS_WEBHOOK_TOKEN. Marks orders paid even if the customer
// never returns to the site (e.g. paid a boleto days later).
export async function POST(req: Request) {
  if (!validToken(req.headers.get("asaas-access-token"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const orderId = body?.payment?.externalReference;
  if (PAID_EVENTS.includes(body?.event) && typeof orderId === "string" && orderId) {
    await markOrderPaid(orderId).catch((e) => console.error("Asaas webhook: could not mark order paid", orderId, e));
  }
  // Always acknowledge so Asaas doesn't pause the webhook queue.
  return Response.json({ received: true });
}
