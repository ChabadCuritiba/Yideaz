import { connection } from "next/server";
import { adminAuth, bucket, explainFirebaseError, firestore } from "@/lib/firebase/server";

type Check = { ok: boolean; detail?: string };

async function check(run: () => Promise<string | void>): Promise<Check> {
  try {
    const detail = await run();
    return { ok: true, ...(detail && { detail }) };
  } catch (e) {
    return { ok: false, detail: explainFirebaseError(e) };
  }
}

// Setup diagnostics: open /api/health on the live site to see which Firebase
// piece isn't ready. Reports no data or secrets, only whether each check passes.
export async function GET() {
  await connection();
  const checks = {
    webConfig: {
      ok: !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      detail: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        ? `project ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`
        : "Firebase web config missing at build time (Google sign-in won't work).",
    },
    firestore: await check(async () => {
      await firestore().collection("posts").limit(1).get();
    }),
    storage: await check(async () => {
      await bucket().getFiles({ prefix: "uploads/", maxResults: 1 });
      return bucket().name;
    }),
    auth: await check(async () => {
      await adminAuth().listUsers(1);
    }),
    adminEmails: {
      ok: !!process.env.ADMIN_EMAILS && !/example\.com/.test(process.env.ADMIN_EMAILS),
      detail: process.env.ADMIN_EMAILS ? undefined : "ADMIN_EMAILS is not set in apphosting.yaml.",
    },
  };
  const ok = Object.values(checks).every((c) => c.ok);
  return Response.json({ ok, checks }, { status: ok ? 200 : 503 });
}
