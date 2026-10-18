import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export function isAdminEmail(email?: string | null) {
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return !!email && allowed.includes(email.toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/admin/login", error: "/admin/login" },
  callbacks: {
    // Only Google accounts listed in ADMIN_EMAILS can sign in.
    signIn({ user }) {
      return isAdminEmail(user.email);
    },
  },
});
