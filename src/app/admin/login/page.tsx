import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAdminEmail, signIn } from "@/auth";

export const metadata = { title: "Admin sign in" };

export default async function Login({ searchParams }: PageProps<"/admin/login">) {
  const session = await auth();
  if (isAdminEmail(session?.user?.email)) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-24">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          yideaz<span className="text-muted">.</span>
        </Link>
        <h1 className="mt-10 text-3xl font-semibold tracking-tighter">Admin panel</h1>
        <p className="mt-3 text-sm text-muted">Sign in with an approved Google account.</p>
        <form
          className="mt-10"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/admin" });
          }}
        >
          <button className="btn-ghost w-full py-3">
            <GoogleIcon />
            Continue with Google
          </button>
        </form>
        {error && (
          <p className="mt-6 text-sm text-red-500">
            {error === "AccessDenied"
              ? "That Google account doesn’t have admin access."
              : "Sign in failed. Please try again."}
          </p>
        )}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.7-4.9h-4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}
