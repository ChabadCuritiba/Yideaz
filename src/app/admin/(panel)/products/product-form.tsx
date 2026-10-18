/* eslint-disable @next/next/no-img-element -- uploaded media */
"use client";

import { useActionState, useEffect, useRef } from "react";
import { createProduct, updateProduct } from "@/lib/admin-actions";
import type { Product } from "@/lib/db";
import { Submit } from "@/components/submit";

export function ProductForm({ product }: { product?: Product }) {
  const [state, action] = useActionState(product ? updateProduct : createProduct, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-8 space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <label className="block">
        <span className="label">Name</span>
        <input name="name" required defaultValue={product?.name} className="input mt-2" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Price</span>
          <input
            name="price"
            required
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={product ? (product.price_cents / 100).toFixed(2) : undefined}
            className="input mt-2"
          />
        </label>
        <label className="block">
          <span className="label">Stock</span>
          <input name="stock" type="number" min={0} defaultValue={product?.stock ?? 1} className="input mt-2" />
        </label>
      </div>
      <label className="block">
        <span className="label">Image</span>
        {product?.image_url && <img src={product.image_url} alt="" className="mt-2 h-24 w-24 rounded-xl object-cover" />}
        <input
          type="file"
          name="image"
          accept="image/*"
          className="input mt-2 file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-3 file:py-1 file:text-sm"
        />
      </label>
      <label className="block">
        <span className="label">Description</span>
        <textarea name="description" rows={4} defaultValue={product?.description} className="input mt-2 resize-none" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={product ? !!product.active : true} className="accent-current" />
        Visible in shop
      </label>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.ok && <p className="text-sm text-muted">Product added.</p>}
      <Submit>{product ? "Save changes" : "Add product"}</Submit>
    </form>
  );
}
