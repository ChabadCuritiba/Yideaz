import "server-only";
import { asaasEnabled, getPayment, PAID_STATUSES } from "./asaas";
import { getOrder, markOrderPaid, type Order } from "./db";

/**
 * Returns the order, first asking Asaas whether a pending payment has come in.
 * Covers the case where the webhook hasn't arrived (or isn't set up).
 */
export async function syncOrder(orderId: string): Promise<Order | undefined> {
  const order = await getOrder(orderId);
  if (order?.status !== "pending" || !order.payment_id || !asaasEnabled()) return order;
  const payment = await getPayment(order.payment_id).catch(() => null);
  if (payment && PAID_STATUSES.includes(payment.status)) {
    await markOrderPaid(order.id);
    return { ...order, status: "paid" };
  }
  return order;
}
