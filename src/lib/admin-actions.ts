"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "./admin";
import * as db from "./db";
import { removeUpload, saveUpload } from "./storage";

export type FormState = { error?: string; ok?: boolean };

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const file = (f: FormData, k: string) => {
  const v = f.get(k);
  return v instanceof File && v.size > 0 ? v : null;
};

function refresh() {
  revalidatePath("/", "layout");
}

/* ---------- posts ---------- */

export async function createPost(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const type = str(form, "type") === "video" ? "video" : "photo";
  const upload = file(form, "file");
  const link = str(form, "url");
  if (!upload && !link) return { error: type === "video" ? "Upload a video or paste a link." : "Choose a photo to upload." };

  try {
    const media_url = upload ? await saveUpload(upload, type === "video" ? "video" : "image") : link;
    db.createPost({ type, title: str(form, "title"), caption: str(form, "caption"), media_url });
  } catch (e) {
    return { error: (e as Error).message };
  }
  refresh();
  return { ok: true };
}

export async function deletePost(form: FormData) {
  await requireAdmin();
  await removeUpload(db.deletePost(Number(form.get("id"))));
  refresh();
}

/* ---------- products ---------- */

async function productInput(form: FormData, current?: string) {
  const price = Number(str(form, "price").replace(",", "."));
  if (!str(form, "name")) throw new Error("Name is required.");
  if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid price.");
  const image = file(form, "image");
  const image_url = image ? await saveUpload(image, "image") : (current ?? "");
  if (image && current) await removeUpload(current);
  return {
    name: str(form, "name"),
    description: str(form, "description"),
    price_cents: Math.round(price * 100),
    stock: Math.max(0, Math.floor(Number(str(form, "stock")) || 0)),
    active: form.get("active") ? 1 : 0,
    image_url,
  };
}

export async function createProduct(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    db.createProduct(await productInput(form));
  } catch (e) {
    return { error: (e as Error).message };
  }
  refresh();
  return { ok: true };
}

export async function updateProduct(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(form.get("id"));
  const existing = await db.getProduct(id);
  if (!existing) return { error: "Product not found." };
  try {
    db.updateProduct(id, await productInput(form, existing.image_url));
  } catch (e) {
    return { error: (e as Error).message };
  }
  refresh();
  redirect("/admin/products");
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  await removeUpload(db.deleteProduct(Number(form.get("id"))));
  refresh();
  redirect("/admin/products");
}

/* ---------- orders ---------- */

export async function updateOrderStatus(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  const status = str(form, "status") as db.Order["status"];
  if (!["pending", "paid", "shipped", "cancelled"].includes(status)) return;
  // Moving a pending order to paid also takes the items out of stock.
  if (!(status === "paid" && db.markOrderPaid(id))) db.setOrderStatus(id, status);
  revalidatePath("/admin/orders");
}
