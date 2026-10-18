/* eslint-disable @next/next/no-img-element -- preview of uploaded media */
"use client";

import { useState } from "react";
import { uploadErrorMessage, uploadFile } from "@/lib/upload";

/**
 * File picker that uploads to Firebase Storage as soon as a file is chosen,
 * then puts the resulting URL and path into hidden form fields.
 */
export function FileUpload({
  name,
  folder,
  accept,
  label,
  onBusy,
}: {
  name: string;
  folder: "posts" | "products";
  accept: string;
  label: string;
  onBusy?: (busy: boolean) => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<{ url: string; path: string; type: string } | null>(null);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setResult(null);
    setError("");
    if (!file) return;
    onBusy?.(true);
    setProgress(0);
    try {
      const { url, path } = await uploadFile(file, folder, setProgress);
      setResult({ url, path, type: file.type });
    } catch (err) {
      console.error("Upload failed", err);
      setError(uploadErrorMessage(err));
      e.target.value = "";
    } finally {
      setProgress(null);
      onBusy?.(false);
    }
  }

  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        className="input mt-2 file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-3 file:py-1 file:text-sm"
      />
      <input type="hidden" name={`${name}_url`} value={result?.url ?? ""} />
      <input type="hidden" name={`${name}_path`} value={result?.path ?? ""} />
      {progress !== null && (
        <span className="mt-2 block h-1 overflow-hidden rounded-full bg-surface">
          <span className="block h-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
        </span>
      )}
      {result && (
        <span className="mt-2 flex items-center gap-2 text-xs text-muted">
          {result.type.startsWith("image/") && <img src={result.url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
          Uploaded ✓
        </span>
      )}
      {error && <span className="mt-2 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
