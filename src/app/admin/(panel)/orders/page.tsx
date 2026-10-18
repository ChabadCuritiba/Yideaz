import Link from "next/link";
import { listOrders, type Order } from "@/lib/db";
import { deleteOrder, updateOrderStatus } from "@/lib/admin-actions";
import { ConfirmSubmit } from "@/components/submit";
import { date, money } from "@/lib/format";
import { StatusSelect } from "./status-select";

const TABS: { key: string; label: string; match: (o: Order) => boolean }[] = [
  { key: "open", label: "Open", match: (o) => o.status === "pending" || o.status === "paid" },
  { key: "shipped", label: "Shipped", match: (o) => o.status === "shipped" },
  { key: "cancelled", label: "Cancelled", match: (o) => o.status === "cancelled" },
  { key: "all", label: "All", match: () => true },
];

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const { tab } = await searchParams;
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const all = await listOrders();
  const orders = all.filter(active.match);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tighter">Orders</h1>
      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "open" ? "/admin/orders" : `/admin/orders?tab=${t.key}`}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              t === active ? "bg-foreground text-background" : "border border-line text-muted hover:text-foreground"
            }`}
          >
            {t.label} <span className="tabular-nums opacity-60">{all.filter(t.match).length}</span>
          </Link>
        ))}
      </div>
      <div className="mt-8 space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl border border-line p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="label">
                  #{o.id.slice(0, 8).toUpperCase()} · {date(o.created_at)}
                  {o.payment_method && ` · ${{ pix: "Pix", credit_card: "Credit card", debit_card: "Debit card" }[o.payment_method]}`}
                </p>
                <p className="mt-2 font-medium">{o.name}</p>
                <a href={`mailto:${o.email}`} className="text-sm text-muted hover:underline">{o.email}</a>
                {o.phone && <p className="text-sm text-muted">{o.phone}</p>}
                {o.address && <p className="mt-1 whitespace-pre-line text-sm text-muted">{o.address}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <form action={updateOrderStatus}>
                  <input type="hidden" name="id" value={o.id} />
                  <StatusSelect value={o.status} />
                </form>
                {o.status === "cancelled" && (
                  <form action={deleteOrder}>
                    <input type="hidden" name="id" value={o.id} />
                    <ConfirmSubmit message="Delete this cancelled order for good?">Delete</ConfirmSubmit>
                  </form>
                )}
              </div>
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
        {orders.length === 0 && <p className="py-10 text-center text-sm text-muted">No {active.key === "all" ? "" : active.label.toLowerCase() + " "}orders.</p>}
      </div>
    </>
  );
}
