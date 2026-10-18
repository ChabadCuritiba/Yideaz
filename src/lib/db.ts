import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { connection } from "next/server";

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

export type Post = {
  id: number;
  type: "photo" | "video";
  title: string;
  caption: string;
  media_url: string;
  created_at: string;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  stock: number;
  active: number;
  created_at: string;
};

export type OrderItem = { productId: number; name: string; price_cents: number; quantity: number };

export type Order = {
  id: number;
  name: string;
  email: string;
  address: string;
  items: OrderItem[];
  total_cents: number;
  status: "pending" | "paid" | "shipped" | "cancelled";
  stripe_session_id: string | null;
  created_at: string;
};

const globalForDb = globalThis as unknown as { yideazDb?: DatabaseSync };

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, "yideaz.db"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
      title TEXT NOT NULL DEFAULT '',
      caption TEXT NOT NULL DEFAULT '',
      media_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price_cents INTEGER NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      stock INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      items TEXT NOT NULL,
      total_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      stripe_session_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

function db() {
  globalForDb.yideazDb ??= open();
  return globalForDb.yideazDb;
}

// Every read waits for a request so pages always show fresh content
// instead of whatever was in the database at build time.
async function read<T>(fn: (d: DatabaseSync) => T): Promise<T> {
  await connection();
  return fn(db());
}

/* ---------- posts ---------- */

export function listPosts(opts: { type?: Post["type"]; limit?: number } = {}) {
  return read((d) => {
    const where = opts.type ? "WHERE type = ?" : "";
    const params = opts.type ? [opts.type] : [];
    return d
      .prepare(`SELECT * FROM posts ${where} ORDER BY id DESC LIMIT ?`)
      .all(...params, opts.limit ?? -1) as unknown as Post[];
  });
}

export function getPost(id: number) {
  return read((d) => d.prepare("SELECT * FROM posts WHERE id = ?").get(id) as unknown as Post | undefined);
}

export function createPost(p: Pick<Post, "type" | "title" | "caption" | "media_url">) {
  db()
    .prepare("INSERT INTO posts (type, title, caption, media_url) VALUES (?, ?, ?, ?)")
    .run(p.type, p.title, p.caption, p.media_url);
}

export function deletePost(id: number) {
  const post = db().prepare("SELECT media_url FROM posts WHERE id = ?").get(id) as { media_url: string } | undefined;
  db().prepare("DELETE FROM posts WHERE id = ?").run(id);
  return post?.media_url;
}

/* ---------- products ---------- */

export function listProducts(opts: { includeInactive?: boolean; limit?: number } = {}) {
  return read(
    (d) =>
      d
        .prepare(`SELECT * FROM products ${opts.includeInactive ? "" : "WHERE active = 1"} ORDER BY id DESC LIMIT ?`)
        .all(opts.limit ?? -1) as unknown as Product[],
  );
}

export function getProduct(id: number) {
  return read((d) => d.prepare("SELECT * FROM products WHERE id = ?").get(id) as unknown as Product | undefined);
}

export function getProductsByIds(ids: number[]) {
  if (ids.length === 0) return [];
  return db()
    .prepare(`SELECT * FROM products WHERE active = 1 AND id IN (${ids.map(() => "?").join(",")})`)
    .all(...ids) as unknown as Product[];
}

type ProductInput = Pick<Product, "name" | "description" | "price_cents" | "image_url" | "stock" | "active">;

export function createProduct(p: ProductInput) {
  db()
    .prepare("INSERT INTO products (name, description, price_cents, image_url, stock, active) VALUES (?, ?, ?, ?, ?, ?)")
    .run(p.name, p.description, p.price_cents, p.image_url, p.stock, p.active);
}

export function updateProduct(id: number, p: ProductInput) {
  db()
    .prepare("UPDATE products SET name = ?, description = ?, price_cents = ?, image_url = ?, stock = ?, active = ? WHERE id = ?")
    .run(p.name, p.description, p.price_cents, p.image_url, p.stock, p.active, id);
}

export function deleteProduct(id: number) {
  const row = db().prepare("SELECT image_url FROM products WHERE id = ?").get(id) as { image_url: string } | undefined;
  db().prepare("DELETE FROM products WHERE id = ?").run(id);
  return row?.image_url;
}

/* ---------- orders ---------- */

type OrderRow = Omit<Order, "items"> & { items: string };
const toOrder = (r: OrderRow): Order => ({ ...r, items: JSON.parse(r.items) });

export function listOrders() {
  return read((d) => (d.prepare("SELECT * FROM orders ORDER BY id DESC").all() as unknown as OrderRow[]).map(toOrder));
}

export function getOrder(id: number) {
  return read((d) => {
    const r = d.prepare("SELECT * FROM orders WHERE id = ?").get(id) as unknown as OrderRow | undefined;
    return r && toOrder(r);
  });
}

export function createOrder(o: Pick<Order, "name" | "email" | "address" | "items" | "total_cents">) {
  const res = db()
    .prepare("INSERT INTO orders (name, email, address, items, total_cents) VALUES (?, ?, ?, ?, ?)")
    .run(o.name, o.email, o.address, JSON.stringify(o.items), o.total_cents);
  return Number(res.lastInsertRowid);
}

export function setOrderStripeSession(id: number, sessionId: string) {
  db().prepare("UPDATE orders SET stripe_session_id = ? WHERE id = ?").run(sessionId, id);
}

export function setOrderStatus(id: number, status: Order["status"]) {
  db().prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
}

/** Marks an order paid once and decrements stock. Safe to call more than once. */
export function markOrderPaid(id: number) {
  const d = db();
  const res = d.prepare("UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'pending'").run(id);
  if (res.changes === 0) return false;
  const row = d.prepare("SELECT items FROM orders WHERE id = ?").get(id) as { items: string };
  const dec = d.prepare("UPDATE products SET stock = MAX(stock - ?, 0) WHERE id = ?");
  for (const item of JSON.parse(row.items) as OrderItem[]) dec.run(item.quantity, item.productId);
  return true;
}

export function counts() {
  return read((d) => {
    const n = (sql: string) => (d.prepare(sql).get() as { n: number }).n;
    return {
      posts: n("SELECT COUNT(*) AS n FROM posts"),
      products: n("SELECT COUNT(*) AS n FROM products"),
      orders: n("SELECT COUNT(*) AS n FROM orders"),
      pendingOrders: n("SELECT COUNT(*) AS n FROM orders WHERE status IN ('pending', 'paid')"),
    };
  });
}
