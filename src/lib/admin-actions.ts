"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "./admin";
import * as db from "./db";
import { removeUpload } from "./storage";

export type FormState = { error?: string; ok?: boolean };

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
// Files are uploaded from the browser to Firebase Storage; forms send back its path.
const storagePath = (f: FormData, k: string, folder: string) => {
  const v = str(f, k);
  return v.startsWith(`uploads/${folder}/`) ? v : "";
};

function refresh() {
  revalidatePath("/", "layout");
}

/* ---------- posts ---------- */

export async function createPost(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const type = str(form, "type") === "video" ? "video" : "photo";
  const media_path = storagePath(form, "media_path", "posts");
  const media_url = media_path ? str(form, "media_url") : str(form, "url");
  if (!media_url) return { error: type === "video" ? "Upload a video or paste a link." : "Choose a photo to upload." };
  if (!/^https?:\/\//.test(media_url)) return { error: "That link doesn’t look right." };

  await db.createPost({ type, title: str(form, "title"), caption: str(form, "caption"), media_url, media_path });
  refresh();
  return { ok: true };
}

export async function deletePost(form: FormData) {
  await requireAdmin();
  await removeUpload(await db.deletePost(str(form, "id")));
  refresh();
}

/* ---------- products ---------- */

function productInput(form: FormData, current?: db.Product): db.ProductInput {
  const price = Number(str(form, "price").replace(",", "."));
  if (!str(form, "name")) throw new Error("Name is required.");
  if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid price.");
  const image_path = storagePath(form, "image_path", "products");
  return {
    name: str(form, "name"),
    description: str(form, "description"),
    price_cents: Math.round(price * 100),
    stock: Math.max(0, Math.floor(Number(str(form, "stock")) || 0)),
    active: !!form.get("active"),
    image_url: image_path ? str(form, "image_url") : (current?.image_url ?? ""),
    image_path: image_path || (current?.image_path ?? ""),
  };
}

export async function createProduct(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    await db.createProduct(productInput(form));
  } catch (e) {
    return { error: (e as Error).message };
  }
  refresh();
  return { ok: true };
}

export async function updateProduct(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(form, "id");
  const existing = await db.getProduct(id);
  if (!existing) return { error: "Product not found." };
  try {
    const input = productInput(form, existing);
    await db.updateProduct(id, input);
    if (input.image_path !== existing.image_path) await removeUpload(existing.image_path);
  } catch (e) {
    return { error: (e as Error).message };
  }
  refresh();
  redirect("/admin/products");
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  await removeUpload(await db.deleteProduct(str(form, "id")));
  refresh();
  redirect("/admin/products");
}

/* ---------- orders ---------- */

export async function updateOrderStatus(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const status = str(form, "status") as db.Order["status"];
  if (!["pending", "paid", "shipped", "cancelled"].includes(status)) return;
  // Moving a pending order to paid also takes the items out of stock.
  if (!(status === "paid" && (await db.markOrderPaid(id)))) await db.setOrderStatus(id, status);
  revalidatePath("/admin/orders");
}

/** Only cancelled orders can be deleted, so real sales stay on record. */
export async function deleteOrder(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const order = await db.getOrder(id);
  if (order?.status === "cancelled") await db.deleteOrder(id);
  revalidatePath("/admin/orders");
}
