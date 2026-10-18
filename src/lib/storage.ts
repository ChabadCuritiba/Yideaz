import "server-only";
import { bucket } from "./firebase/server";

/** Removes an uploaded file from Firebase Storage. Ignores empty paths. */
export async function removeUpload(path: string | undefined) {
  if (!path?.startsWith("uploads/")) return;
  await bucket().file(path).delete({ ignoreNotFound: true }).catch(() => {});
}
