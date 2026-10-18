import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/admins";
import { SESSION_COOKIE } from "@/lib/admin";
import { adminAuth } from "@/lib/firebase/server";

const MAX_AGE = 60 * 60 * 24 * 5; // 5 days, the longest Firebase allows is 14

// Exchanges a Firebase ID token from "Continue with Google" for a session cookie.
export async function POST(req: Request) {
  const { idToken } = await req.json().catch(() => ({}));
  if (typeof idToken !== "string") return Response.json({ error: "Missing token" }, { status: 400 });

  const auth = adminAuth();
  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  // Keep the `admin` claim in sync with ADMIN_EMAILS; Storage rules use it to allow uploads.
  const isAdmin = isAdminEmail(decoded.email) && decoded.email_verified === true;
  if (!!decoded.admin !== isAdmin) {
    const user = await auth.getUser(decoded.uid);
    await auth.setCustomUserClaims(decoded.uid, { ...user.customClaims, admin: isAdmin || undefined });
  }
  if (!isAdmin) return Response.json({ error: "AccessDenied" }, { status: 403 });

  const session = await auth.createSessionCookie(idToken, { expiresIn: MAX_AGE * 1000 });
  (await cookies()).set(SESSION_COOKIE, session, {
    maxAge: MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return Response.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
