/* eslint-disable @next/next/no-img-element -- uploaded media */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/db";
import { money } from "@/lib/format";
import { AddToCart } from "./add-to-cart";

export async function generateMetadata({ params }: PageProps<"/shop/[id]">) {
  const product = await getProduct(Number((await params).id));
  return { title: product?.name || "Product" };
}

export default async function ProductPage({ params }: PageProps<"/shop/[id]">) {
  const product = await getProduct(Number((await params).id));
  if (!product || !product.active) notFound();

  return (
    <div className="container-x pt-10">
      <Link href="/shop" className="text-sm text-muted hover:text-foreground">← Shop</Link>
      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="aspect-square overflow-hidden rounded-2xl bg-surface">
          {product.image_url && <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />}
        </div>
        <div className="md:py-6">
          <h1 className="text-4xl font-semibold tracking-tighter">{product.name}</h1>
          <p className="mt-3 text-xl text-muted">{money(product.price_cents)}</p>
          {product.description && (
            <p className="mt-8 whitespace-pre-line leading-relaxed text-muted">{product.description}</p>
          )}
          <div className="mt-10">
            {product.stock > 0 ? (
              <AddToCart
                product={{
                  productId: product.id,
                  name: product.name,
                  price_cents: product.price_cents,
                  image_url: product.image_url,
                }}
                max={product.stock}
              />
            ) : (
              <p className="label">Sold out</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
