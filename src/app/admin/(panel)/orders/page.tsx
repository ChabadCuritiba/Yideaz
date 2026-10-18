import { listOrders } from "@/lib/db";
import { updateOrderStatus } from "@/lib/admin-actions";
import { date, money } from "@/lib/format";
import { StatusSelect } from "./status-select";

export default async function AdminOrders() {
  const orders = await listOrders();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tighter">Orders</h1>
      <div className="mt-10 space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl border border-line p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="label">#{o.id} · {date(o.created_at)}</p>
                <p className="mt-2 font-medium">{o.name}</p>
                <a href={`mailto:${o.email}`} className="text-sm text-muted hover:underline">{o.email}</a>
                {o.address && <p className="mt-1 whitespace-pre-line text-sm text-muted">{o.address}</p>}
              </div>
              <form action={updateOrderStatus}>
                <input type="hidden" name="id" value={o.id} />
                <StatusSelect value={o.status} />
              </form>
            </div>
            <ul className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
              {o.items.map((i) => (
                <li key={i.productId} className="flex justify-between">
                  <span>{i.quantity} × {i.name}</span>
                  <span className="tabular-nums text-muted">{money(i.price_cents * i.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between pt-2 font-medium">
                <span>Total</span>
                <span className="tabular-nums">{money(o.total_cents)}</span>
              </li>
            </ul>
          </div>
        ))}
        {orders.length === 0 && <p className="py-10 text-center text-sm text-muted">No orders yet.</p>}
      </div>
    </>
  );
}
