/* eslint-disable @next/next/no-img-element -- Google avatar */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "./nav";
import { SignOut } from "./sign-out";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-semibold tracking-tight">
              yideaz<span className="text-muted">/admin</span>
            </Link>
            <AdminNav />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="hidden text-muted hover:text-foreground sm:inline">View site ↗</Link>
            {user.picture && <img src={user.picture} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />}
            <SignOut />
          </div>
        </div>
      </header>
      <main className="container-x flex-1 py-12">{children}</main>
    </div>
  );
}
