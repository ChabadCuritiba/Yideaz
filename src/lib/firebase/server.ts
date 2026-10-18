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

/** Turns common Firebase setup mistakes into a plain-language hint. */
export function explainFirebaseError(e: unknown) {
  const err = e as { code?: number | string; message?: string };
  const msg = err.message ?? String(e);
  if (/bucket does not exist|bucket name/i.test(msg)) {
    return "Storage bucket not found. In the Firebase console open Build → Storage and click Get started.";
  }
  if (err.code === 5 || /NOT_FOUND/.test(msg)) {
    return "Firestore database not found. In the Firebase console open Build → Firestore Database and click Create database (Native mode, database ID “(default)”).";
  }
  if (err.code === 7 || /PERMISSION_DENIED/.test(msg)) {
    return "Permission denied. Make sure the Cloud Firestore API is enabled and the App Hosting service account has access to the project.";
  }
  if (/Datastore Mode/i.test(msg)) {
    return "This project's database is in Datastore mode. Yideaz needs Firestore in Native mode.";
  }
  if (/project id|projectId/i.test(msg)) {
    return "Firebase project ID is missing. On App Hosting it is provided automatically; locally set NEXT_PUBLIC_FIREBASE_PROJECT_ID.";
  }
  return msg;
}
