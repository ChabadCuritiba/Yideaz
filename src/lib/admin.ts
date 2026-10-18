import "server-only";
import { redirect } from "next/navigation";
import { auth, isAdminEmail } from "@/auth";

/** Use at the top of every admin page and Server Action. */
export async function requireAdmin() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) redirect("/admin/login");
  return session!.user!;
}
