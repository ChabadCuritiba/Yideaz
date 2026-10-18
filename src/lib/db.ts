import "server-only";
import { FieldValue, Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { connection } from "next/server";
import { firestore } from "./firebase/server";

export type Post = {
  id: string;
  type: "photo" | "video";
  title: string;
  caption: string;
  media_url: string;
  /** Path in Firebase Storage, empty for YouTube/Vimeo links. */
  media_path: string;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  image_path: string;
  stock: number;
  active: boolean;
  created_at: string;
};

export type OrderItem = { productId: string; name: string; price_cents: number; quantity: number };

export type Order = {
  id: string;
  name: string;
  email: string;
  address: string;
  items: OrderItem[];
  total_cents: number;
  status: "pending" | "paid" | "shipped" | "cancelled";
  /** Asaas charge id, when paid through Asaas. */
  payment_id: string | null;
  created_at: string;
};

const posts = () => firestore().collection("posts");
const products = () => firestore().collection("products");
const orders = () => firestore().collection("orders");

function toPlain<T>(doc: DocumentSnapshot): T {
  const { created_at, ...data } = doc.data()!;
  return { id: doc.id, ...data, created_at: (created_at as Timestamp | undefined)?.toDate().toISOString() ?? "" } as T;
}

// Every read waits for a request so pages always show fresh content.
async function ready() {
  await connection();
}

/* ---------- posts ---------- */

export async function listPosts(opts: { type?: Post["type"]; limit?: number } = {}) {
  await ready();
  // Filtered in memory so no composite Firestore index is needed.
  const snap = await posts().orderBy("created_at", "desc").get();
  const all = snap.docs.map((d) => toPlain<Post>(d)).filter((p) => !opts.type || p.type === opts.type);
  return opts.limit ? all.slice(0, opts.limit) : all;
}

export async function getPost(id: string) {
  await ready();
  const doc = await posts().doc(id).get();
  return doc.exists ? toPlain<Post>(doc) : undefined;
}

export async function createPost(p: Omit<Post, "id" | "created_at">) {
  await posts().add({ ...p, created_at: FieldValue.serverTimestamp() });
}

/** Deletes a post and returns its Storage path, if any. */
export async function deletePost(id: string) {
  const ref = posts().doc(id);
  const doc = await ref.get();
  await ref.delete();
  return doc.get("media_path") as string | undefined;
}

/* ---------- products ---------- */

export async function listProducts(opts: { includeInactive?: boolean; limit?: number } = {}) {
  await ready();
  const snap = await products().orderBy("created_at", "desc").get();
  const all = snap.docs.map((d) => toPlain<Product>(d)).filter((p) => opts.includeInactive || p.active);
  return opts.limit ? all.slice(0, opts.limit) : all;
}

export async function getProduct(id: string) {
  await ready();
  const doc = await products().doc(id).get();
  return doc.exists ? toPlain<Product>(doc) : undefined;
}

export async function getProductsByIds(ids: string[]) {
  const refs = [...new Set(ids)].filter(Boolean).map((id) => products().doc(id));
  if (refs.length === 0) return [];
  const docs = await firestore().getAll(...refs);
  return docs.filter((d) => d.exists).map((d) => toPlain<Product>(d)).filter((p) => p.active);
}

export type ProductInput = Omit<Product, "id" | "created_at">;

export async function createProduct(p: ProductInput) {
  await products().add({ ...p, created_at: FieldValue.serverTimestamp() });
}

export async function updateProduct(id: string, p: ProductInput) {
  await products().doc(id).update(p);
}

/** Deletes a product and returns its image's Storage path, if any. */
export async function deleteProduct(id: string) {
  const ref = products().doc(id);
  const doc = await ref.get();
  await ref.delete();
  return doc.get("image_path") as string | undefined;
}

/* ---------- orders ---------- */

export async function listOrders() {
  await ready();
  const snap = await orders().orderBy("created_at", "desc").get();
  return snap.docs.map((d) => toPlain<Order>(d));
}

export async function getOrder(id: string) {
  await ready();
  if (!id) return undefined;
  const doc = await orders().doc(id).get();
  return doc.exists ? toPlain<Order>(doc) : undefined;
}

export async function createOrder(o: Pick<Order, "name" | "email" | "address" | "items" | "total_cents">) {
  const ref = await orders().add({
    ...o,
    status: "pending",
    payment_id: null,
    created_at: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function setOrderPayment(id: string, paymentId: string) {
  await orders().doc(id).update({ payment_id: paymentId });
}

export async function setOrderStatus(id: string, status: Order["status"]) {
  await orders().doc(id).update({ status });
}

/** Marks a pending order paid and takes its items out of stock. Returns false if it wasn't pending. */
export async function markOrderPaid(id: string) {
  const db = firestore();
  return db.runTransaction(async (tx) => {
    const ref = orders().doc(id);
    const order = await tx.get(ref);
    if (!order.exists || order.get("status") !== "pending") return false;
    const items = order.get("items") as OrderItem[];
    const refs = items.map((i) => products().doc(i.productId));
    const docs = refs.length ? await tx.getAll(...refs) : [];
    docs.forEach((doc, i) => {
      if (doc.exists) tx.update(doc.ref, { stock: Math.max(0, (doc.get("stock") as number) - items[i].quantity) });
    });
    tx.update(ref, { status: "paid" });
    return true;
  });
}

export async function counts() {
  await ready();
  const count = async (q: FirebaseFirestore.Query) => (await q.count().get()).data().count;
  const [p, pr, open] = await Promise.all([
    count(posts()),
    count(products()),
    count(orders().where("status", "in", ["pending", "paid"])),
  ]);
  return { posts: p, products: pr, pendingOrders: open };
}
