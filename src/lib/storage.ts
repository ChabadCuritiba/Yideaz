import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DATA_DIR } from "./db";

export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/mp4",
};

/** Saves an uploaded file and returns the public URL it is served from. */
export async function saveUpload(file: File, kind: "image" | "video" | "any" = "any") {
  const ext = path.extname(file.name).toLowerCase();
  const mime = MIME[ext];
  if (!mime || (kind !== "any" && !mime.startsWith(kind))) {
    throw new Error(`Unsupported file type: ${file.name}`);
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/media/${name}`;
}

/** Removes a previously uploaded file. Ignores external URLs. */
export async function removeUpload(url: string | undefined) {
  if (!url?.startsWith("/media/")) return;
  await fs.promises.rm(path.join(UPLOAD_DIR, path.basename(url)), { force: true });
}
