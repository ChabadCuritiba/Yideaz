import Link from "next/link";
import { counts } from "@/lib/db";

export default async function Overview() {
  const c = await counts();
  const stats = [
    { label: "Posts", value: c.posts, href: "/admin/posts", cta: "Add photo or video" },
    { label: "Products", value: c.products, href: "/admin/products", cta: "Add product" },
    { label: "Open orders", value: c.pendingOrders, href: "/admin/orders", cta: "View orders" },
  ];

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tighter">Overview</h1>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-2xl border border-line p-6 transition hover:border-foreground">
            <p className="label">{s.label}</p>
            <p className="mt-4 text-5xl font-semibold tracking-tighter tabular-nums">{s.value}</p>
            <p className="mt-6 text-sm text-muted group-hover:text-foreground">{s.cta} →</p>
          </Link>
        ))}
      </div>
    </>
  );
}
