import Link from "next/link";
import { asaasEnabled, getPayment, PAID_STATUSES } from "@/lib/asaas";
import { getOrder, markOrderPaid } from "@/lib/db";
import { money } from "@/lib/format";
import { ClearCart } from "./clear-cart";

export default async function Success({ searchParams }: PageProps<"/checkout/success">) {
  const { order: orderId } = await searchParams;
  let order = await getOrder(typeof orderId === "string" ? orderId : "");

  // Check with Asaas in case the webhook hasn't arrived yet.
  if (order?.status === "pending" && order.payment_id && asaasEnabled()) {
    const payment = await getPayment(order.payment_id).catch(() => null);
    if (payment && PAID_STATUSES.includes(payment.status)) {
      await markOrderPaid(order.id);
      order = { ...order, status: "paid" };
    }
  }

  return (
    <div className="container-x max-w-xl pt-24 text-center">
      <ClearCart />
      <p className="label">Order #{order?.id.slice(0, 8).toUpperCase() ?? "—"}</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">Thank you.</h1>
      <p className="mt-6 text-muted">
        {order?.status === "paid"
          ? `Your payment of ${money(order.total_cents)} was received. A confirmation is on its way to ${order.email}.`
          : order?.payment_id
            ? "We’ve received your order. As soon as your payment is confirmed (Pix is instant, boleto can take up to 3 business days) we’ll get it ready."
            : "We’ve received your order and will be in touch shortly to complete it."}
      </p>
      <Link href="/" className="btn-ghost mt-10">Back home</Link>
    </div>
  );
}
