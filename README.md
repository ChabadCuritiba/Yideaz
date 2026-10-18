# Yideaz

A minimalist website for posting **videos and photos**, with a built-in **e‑shop** and an **admin panel** you sign into with **Continue with Google**. Runs entirely on **Firebase**.

- **Gallery**: photos, uploaded videos, and YouTube/Vimeo links, filterable by type
- **Shop**: products with images and stock, plus a cart and checkout (Stripe is optional)
- **Admin panel** (`/admin`): add or delete posts; add, edit, hide or delete products; manage orders
- Light and dark mode follow the visitor's system setting

| Piece | Firebase service |
| --- | --- |
| The website (Next.js 16) | App Hosting |
| Continue with Google | Authentication |
| Posts, products, orders | Firestore |
| Photos, videos, product images | Storage (uploaded straight from the browser, so large videos work) |

## One-time Firebase setup

You need a Firebase project on the **Blaze** plan.

1. **Authentication**: Build → Authentication → Get started → Sign-in method → enable **Google**.
2. **Firestore**: Build → Firestore Database → Create database (production mode).
3. **Storage**: Build → Storage → Get started.
4. **Web app config**: Project settings → General → Your apps → Add app → Web. Copy the values into `apphosting.yaml` (and into `.env.local` for local development).
5. **Admins**: put your Google email in `ADMIN_EMAILS` in `apphosting.yaml`. Separate several with commas.
6. **Security rules**: from this folder run:
   ```bash
   npx firebase login
   npx firebase use --add          # pick your project
   npm run deploy:rules            # uploads firestore.rules + storage.rules
   ```

## Deploy

1. Push this repo to GitHub.
2. In the Firebase console go to Build → **App Hosting** → Get started, connect the GitHub repo and choose the branch. Each push now deploys automatically.
3. Copy your new site address (`https://<backend>--<project>.<region>.hosted.app`):
   - put it in `SITE_URL` in `apphosting.yaml`
   - add its domain under Authentication → Settings → **Authorized domains** (needed for Google sign-in)
   - do the same for any custom domain you connect later

## Payments (optional)

Without Stripe, checkout saves orders as **pending** and you follow up with the customer yourself.

To take card payments:

```bash
npx firebase apphosting:secrets:set stripe-secret-key       # paste sk_live_...
```

Then uncomment the `STRIPE_SECRET_KEY` lines in `apphosting.yaml`. To mark orders paid even if a customer closes the tab after paying, add a Stripe webhook for `checkout.session.completed` pointing at `https://<your-site>/api/stripe/webhook`, store its signing secret as `stripe-webhook-secret`, and uncomment `STRIPE_WEBHOOK_SECRET`.

## Using the admin panel

Go to `/admin` (there's also a link in the footer) and choose **Continue with Google**.

| Page | What you can do |
| --- | --- |
| Posts | Upload a photo, upload a video (mp4/webm/mov, up to 2 GB) or paste a YouTube/Vimeo link; add a title and caption; delete posts |
| Products | Add a product with image, price, stock and description; click one to edit, hide or delete it |
| Orders | See customer details and items; change status (pending → paid → shipped / cancelled). Marking a pending order paid takes the items out of stock |

## Local development

Requires **Node.js 22+** and, for the emulators, **Java 11+**.

**Option A: emulators (no real project needed).** Everything runs locally with fake data:

```bash
npm install
npm run emulators          # terminal 1 (Emulator UI at http://127.0.0.1:4000)
npm run dev:emulators      # terminal 2: http://localhost:3000, sign in as admin@example.com
```

**Option B: your real Firebase project.**

```bash
cp .env.example .env.local   # fill in the web config, ADMIN_EMAILS and FIREBASE_SERVICE_ACCOUNT_KEY
npm run dev
```

## How access is protected

- Firestore is closed to browsers (`firestore.rules`). All reads and writes go through the server.
- When an approved admin signs in, the server gives their account an `admin` flag. Storage only accepts uploads from accounts with that flag (`storage.rules`). Everyone can view uploaded media.
- Every admin page and action checks the session on the server.
