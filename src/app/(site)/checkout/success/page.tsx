import Link from "next/link";
import { getOrder } from "@/lib/db";
import { money } from "@/lib/format";
import { confirmStripeSession } from "@/lib/stripe-sync";
import { ClearCart } from "./clear-cart";

export default async function Success({ searchParams }: PageProps<"/checkout/success">) {
  const { order: orderId, session_id } = await searchParams;
  if (typeof session_id === "string") await confirmStripeSession(session_id).catch(() => false);
  const order = await getOrder(typeof orderId === "string" ? orderId : "");

  return (
    <div className="container-x max-w-xl pt-24 text-center">
      <ClearCart />
      <p className="label">Order #{order?.id.slice(0, 8).toUpperCase() ?? "—"}</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">Thank you.</h1>
      <p className="mt-6 text-muted">
        {order?.status === "paid"
          ? `Your payment of ${money(order.total_cents)} was received. A confirmation is on its way to ${order.email}.`
          : "We’ve received your order and will be in touch shortly to complete it."}
      </p>
      <Link href="/" className="btn-ghost mt-10">Back home</Link>
    </div>
  );
}
