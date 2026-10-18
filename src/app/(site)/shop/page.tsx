import type { Metadata } from "next";
import { listProducts } from "@/lib/db";
import { Empty, ProductCard } from "@/components/media";

export const metadata: Metadata = { title: "Shop" };

export default async function Shop() {
  const products = await listProducts();
  return (
    <div className="container-x pt-16">
      <p className="label">Shop</p>
      <h1 className="mt-4 mb-12 text-4xl font-semibold tracking-tighter sm:text-6xl">Made to keep.</h1>
      {products.length ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <Empty>No products yet — check back soon.</Empty>
      )}
    </div>
  );
}
