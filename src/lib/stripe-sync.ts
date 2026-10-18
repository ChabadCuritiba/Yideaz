import "server-only";
import Stripe from "stripe";
import { markOrderPaid } from "./db";

/** Confirms a Checkout Session with Stripe and marks its order paid. */
export async function confirmStripeSession(sessionId: string) {
  if (!process.env.STRIPE_SECRET_KEY) return false;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid" || !session.metadata?.orderId) return false;
  await markOrderPaid(session.metadata.orderId);
  return true;
}
