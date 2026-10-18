/* eslint-disable @next/next/no-img-element -- uploaded media */
"use client";

import { useEffect, useState } from "react";
import { createProduct, updateProduct } from "@/lib/admin-actions";
import type { Product } from "@/lib/db";
import { Submit } from "@/components/submit";
import { useFormAction } from "@/components/use-form-action";
import { FileUpload } from "@/components/file-upload";

export function ProductForm({ product }: { product?: Product }) {
  const [state, onSubmit, pending] = useFormAction(product ? updateProduct : createProduct, {});
  const [busy, setBusy] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset after the action resolves
    if (state.ok) setFormKey((k) => k + 1);
  }, [state]);

  return (
    <form key={formKey} onSubmit={onSubmit} className="mt-8 space-y-4">
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
      {product?.image_url && <img src={product.image_url} alt="" className="h-24 w-24 rounded-xl object-cover" />}
      <FileUpload name="image" folder="products" accept="image/*" label={product ? "Replace image" : "Image"} onBusy={setBusy} />
      <label className="block">
        <span className="label">Description</span>
        <textarea name="description" rows={4} defaultValue={product?.description} className="input mt-2 resize-none" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={product ? product.active : true} className="accent-current" />
        Visible in shop
      </label>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.ok && <p className="text-sm text-muted">Product added.</p>}
      <Submit pending={pending} disabled={busy}>{busy ? "Uploading…" : product ? "Save changes" : "Add product"}</Submit>
    </form>
  );
}
