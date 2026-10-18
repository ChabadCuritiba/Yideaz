"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { firebaseClient } from "@/lib/firebase/client";

export function GoogleSignIn() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setPending(true);
    setError("");
    const { auth } = firebaseClient();
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: await user.getIdToken() }),
      });
      if (!res.ok) {
        await signOut(auth);
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error === "AccessDenied" ? "That Google account doesn’t have admin access." : "Sign in failed.");
      }
      // Pick up the `admin` claim the server just set, needed for uploads.
      await user.getIdToken(true);
      router.replace("/admin");
      router.refresh();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError((e as Error).message || "Sign in failed. Please try again.");
      }
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" onClick={signIn} disabled={pending} className="btn-ghost mt-10 w-full py-3">
        <GoogleIcon />
        {pending ? "Signing in…" : "Continue with Google"}
      </button>
      {error && <p className="mt-6 text-sm text-red-500">{error}</p>}
    </>
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
