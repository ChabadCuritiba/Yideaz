import Stripe from "stripe";
import { markOrderPaid } from "@/lib/db";

// Optional: point a Stripe webhook (checkout.session.completed) here so orders
// are marked paid even if the customer closes the tab before the success page.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !secret) return new Response("Not configured", { status: 404 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
    const orderId = event.data.object.metadata?.orderId;
    if (orderId) markOrderPaid(Number(orderId));
  }
  return Response.json({ received: true });
}
