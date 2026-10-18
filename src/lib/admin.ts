import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminEmail } from "./admins";
import { adminAuth } from "./firebase/server";

// Firebase hosting only forwards a cookie with this exact name.
export const SESSION_COOKIE = "__session";

/** The signed-in admin, or null. */
export async function currentAdmin() {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const user = await adminAuth().verifySessionCookie(cookie, true);
    return isAdminEmail(user.email) ? { email: user.email!, name: user.name as string | undefined, picture: user.picture } : null;
  } catch {
    return null;
  }
}

/** Use at the top of every admin page and Server Action. */
export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
