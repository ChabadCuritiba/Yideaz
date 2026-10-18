import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin";
import { GoogleSignIn } from "./google-sign-in";

export const metadata = { title: "Admin sign in" };

export default async function Login() {
  if (await currentAdmin()) redirect("/admin");

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-24">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          yideaz<span className="text-muted">.</span>
        </Link>
        <h1 className="mt-10 text-3xl font-semibold tracking-tighter">Admin panel</h1>
        <p className="mt-3 text-sm text-muted">Sign in with an approved Google account.</p>
        <GoogleSignIn />
      </div>
    </main>
  );
}
