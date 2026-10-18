"use client";

import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { firebaseClient } from "./firebase/client";

/**
 * Uploads a file straight from the browser to Firebase Storage, so large videos
 * don't pass through the server. Storage rules only allow signed-in admins.
 */
export async function uploadFile(file: File, folder: "posts" | "products", onProgress?: (pct: number) => void) {
  const { auth, storage } = firebaseClient();
  if (!storage.app.options.storageBucket) {
    throw new Error("Firebase Storage isn’t set up yet. In the Firebase console open Build → Storage → Get started, then redeploy the site.");
  }
  await auth.authStateReady();
  if (!auth.currentUser) throw new Error("Your session expired — please sign in again.");
  // Make sure the token carries the latest `admin` claim.
  await auth.currentUser.getIdToken(true);

  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
  const path = `uploads/${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
  const task = uploadBytesResumable(ref(storage, path), file, {
    contentType: file.type,
    cacheControl: "public, max-age=31536000",
  });
  task.on("state_changed", (s) => onProgress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100)));
  await task;
  return { url: await getDownloadURL(task.snapshot.ref), path };
}

/** Plain-language explanation for a failed upload. */
export function uploadErrorMessage(err: unknown) {
  const code = (err as { code?: string }).code;
  switch (code) {
    case "storage/unauthorized":
      return "Upload blocked. Make sure the Storage rules are published, then sign out of the admin panel and sign in again.";
    case "storage/unauthenticated":
      return "Your session expired — please sign in again.";
    case "storage/bucket-not-found":
    case "storage/no-default-bucket":
    case "storage/project-not-found":
      return "Firebase Storage isn’t set up yet. In the Firebase console open Build → Storage → Get started, then redeploy the site.";
    case "storage/quota-exceeded":
      return "Storage quota exceeded. Check your Firebase plan and usage.";
    case "storage/retry-limit-exceeded":
      return "The connection dropped during the upload. Please try again.";
    case "storage/canceled":
      return "Upload canceled.";
  }
  return (err as Error).message || "Upload failed.";
}
