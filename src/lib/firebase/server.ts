import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function app(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  // On Firebase App Hosting credentials are automatic. Locally, either set
  // FIREBASE_SERVICE_ACCOUNT_KEY (the JSON key) or use the emulators.
  if (key) return initializeApp({ credential: cert(JSON.parse(key)), storageBucket: bucket });
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  // With no options, the Admin SDK reads FIREBASE_CONFIG, which App Hosting sets.
  return initializeApp(projectId ? { projectId, storageBucket: bucket } : undefined);
}

export const adminAuth = () => getAuth(app());
export const firestore = () => getFirestore(app());
export const bucket = () => getStorage(app()).bucket();
