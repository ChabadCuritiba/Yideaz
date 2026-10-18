import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/db";
import { deleteProduct } from "@/lib/admin-actions";
import { ConfirmSubmit } from "@/components/submit";
import { ProductForm } from "../product-form";

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  const product = await getProduct(Number((await params).id));
  if (!product) notFound();

  return (
    <div className="max-w-md">
      <Link href="/admin/products" className="text-sm text-muted hover:text-foreground">← Products</Link>
      <div className="mt-6 flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold tracking-tighter">Edit product</h1>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <ConfirmSubmit message="Delete this product?">Delete</ConfirmSubmit>
        </form>
      </div>
      <ProductForm product={product} />
    </div>
  );
}
