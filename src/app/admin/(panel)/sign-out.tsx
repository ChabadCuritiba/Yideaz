"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { firebaseClient } from "@/lib/firebase/client";

export function SignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-muted hover:text-foreground"
      onClick={async () => {
        await Promise.all([fetch("/api/session", { method: "DELETE" }), signOut(firebaseClient().auth)]);
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
