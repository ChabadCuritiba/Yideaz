"use client";

import { useEffect, useState } from "react";
import { createPost } from "@/lib/admin-actions";
import { Submit } from "@/components/submit";
import { useFormAction } from "@/components/use-form-action";
import { FileUpload } from "@/components/file-upload";

export function PostForm() {
  const [state, onSubmit, pending] = useFormAction(createPost, {});
  const [type, setType] = useState<"photo" | "video">("photo");
  const [busy, setBusy] = useState(false);
  // Remount the form after each successful post to clear it.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset after the action resolves
    if (state.ok) setFormKey((k) => k + 1);
  }, [state]);

  return (
    <form key={`${formKey}-${type}`} onSubmit={onSubmit} className="mt-8 space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-full border border-line p-1 text-sm">
        {(["photo", "video"] as const).map((t) => (
          <label
            key={t}
            className={`cursor-pointer rounded-full py-2 text-center capitalize transition ${type === t ? "bg-foreground text-background" : "text-muted"}`}
          >
            <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
            {t}
          </label>
        ))}
      </div>

      <FileUpload
        name="media"
        folder="posts"
        label={type === "photo" ? "Photo file" : "Video file"}
        accept={type === "photo" ? "image/*" : "video/mp4,video/webm,video/quicktime"}
        onBusy={setBusy}
      />

      {type === "video" && (
        <label className="block">
          <span className="label">…or YouTube / Vimeo link</span>
          <input name="url" type="url" placeholder="https://youtube.com/watch?v=…" className="input mt-2" />
        </label>
      )}

      <label className="block">
        <span className="label">Idea category</span>
        <input name="category" list="post-categories" placeholder="e.g. Gifts, Decor, Recipes — pick or type new" className="input mt-2" />
      </label>
      <label className="block">
        <span className="label">Title</span>
        <input name="title" className="input mt-2" />
      </label>
      <label className="block">
        <span className="label">Caption</span>
        <textarea name="caption" rows={3} className="input mt-2 resize-none" />
      </label>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.ok && <p className="text-sm text-muted">Posted.</p>}
      <Submit pendingText="Publishing…" pending={pending} disabled={busy}>{busy ? "Uploading…" : "Publish"}</Submit>
    </form>
  );
}
