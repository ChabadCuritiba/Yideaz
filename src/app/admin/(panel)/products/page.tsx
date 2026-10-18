/* eslint-disable @next/next/no-img-element -- uploaded media */
import Link from "next/link";
import { listProducts } from "@/lib/db";
import { money } from "@/lib/format";
import { ProductForm } from "./product-form";

export default async function AdminProducts() {
  const products = await listProducts({ includeInactive: true });

  return (
    <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
      <section>
        <h1 className="text-3xl font-semibold tracking-tighter">New product</h1>
        <p className="mt-2 text-sm text-muted">Add something to the shop.</p>
        <ProductForm />
      </section>

      <section>
        <p className="label mb-4">{products.length} products</p>
        <ul className="divide-y divide-line border-y border-line">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4 py-4 hover:opacity-70">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
                  {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="label mt-1">
                    {p.stock} in stock{!p.active && " · hidden"}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{money(p.price_cents)}</p>
              </Link>
            </li>
          ))}
          {products.length === 0 && <li className="py-10 text-center text-sm text-muted">No products yet.</li>}
        </ul>
      </section>
    </div>
  );
}
