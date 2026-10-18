import type { NextConfig } from "next";

// Firebase App Hosting provides the project's web config at build time as
// FIREBASE_WEBAPP_CONFIG. Use it when the NEXT_PUBLIC_FIREBASE_* values aren't set,
// so nothing has to be copied into apphosting.yaml by hand.
const webapp = (() => {
  try {
    return JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG || "{}") as Record<string, string>;
  } catch {
    return {};
  }
})();

const firebaseEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || webapp.apiKey || "",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || webapp.authDomain || "",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || webapp.projectId || "",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || webapp.storageBucket || "",
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || webapp.appId || "",
};

const nextConfig: NextConfig = {
  env: firebaseEnv,
  serverExternalPackages: ["firebase-admin"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
