# Yideaz

A minimalist website for posting **videos and photos**, with a built-in **e‑shop** and an **admin panel** you sign into with **Continue with Google**.

- **Gallery** — photos, uploaded videos, and YouTube/Vimeo links, filterable by type
- **Shop** — products with images, stock, cart and checkout (Stripe, optional)
- **Admin panel** (`/admin`) — add/delete posts, add/edit/hide/delete products, manage orders
- Light and dark mode follow the visitor's system setting

Built with Next.js 16, Tailwind CSS 4, Auth.js (Google) and the SQLite built into Node.js 22 — no external database needed.

## Getting started

Requires **Node.js 22.13+**.

```bash
npm install
cp .env.example .env.local   # then fill it in (see below)
npm run dev                  # http://localhost:3000
```

### 1. Google sign-in

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) and create an **OAuth client ID** (type: *Web application*).
2. Add the authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (and the same path on your real domain when you deploy).
3. Put the client ID and secret in `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.
4. Set `AUTH_SECRET` (run `npx auth secret` or `openssl rand -base64 32`).
5. Put your Google email in `ADMIN_EMAILS` (comma-separate several). Only these accounts can open the admin panel.

### 2. Payments (optional)

Set `STRIPE_SECRET_KEY` to take card payments with Stripe Checkout. Without it, checkout still works: orders are saved as **pending** and you follow up with the customer yourself.

To mark orders paid even if a customer closes the tab after paying, add a Stripe webhook for `checkout.session.completed` pointing at `/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET`.

Set `SITE_URL` to your public URL so Stripe redirects back correctly, and `CURRENCY` (e.g. `usd`, `eur`, `brl`).

## Using the admin panel

Go to `/admin` (there's also a link in the footer) and choose **Continue with Google**.

| Page | What you can do |
| --- | --- |
| Posts | Upload a photo, upload a video (mp4/webm/mov) or paste a YouTube/Vimeo link; add a title and caption; delete posts |
| Products | Add a product with image, price, stock and description; click one to edit, hide or delete it |
| Orders | See customer details and items; change status (pending → paid → shipped / cancelled). Marking a pending order paid takes the items out of stock |

## Where data lives

Everything is stored in `./data` (change with `DATA_DIR`):

- `data/yideaz.db` — posts, products and orders
- `data/uploads/` — uploaded photos and videos, served at `/media/...`

Back up this folder. When deploying, use a host with a persistent disk (a VPS, Railway, Render, Fly.io with a volume, etc.) and point `DATA_DIR` at it. Serverless hosts with read-only/ephemeral file systems (like plain Vercel) won't keep uploads.

```bash
npm run build
npm start
```
