"use client";

import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { firebaseClient } from "./firebase/client";

/**
 * Uploads a file straight from the browser to Firebase Storage, so large videos
 * don't pass through the server. Storage rules only allow signed-in admins.
 */
export async function uploadFile(file: File, folder: "posts" | "products", onProgress?: (pct: number) => void) {
  const { auth, storage } = firebaseClient();
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
