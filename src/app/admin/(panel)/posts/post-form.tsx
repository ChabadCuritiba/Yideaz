"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPost } from "@/lib/admin-actions";
import { Submit } from "@/components/submit";

export function PostForm() {
  const [state, action] = useActionState(createPost, {});
  const [type, setType] = useState<"photo" | "video">("photo");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-8 space-y-4">
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

      <label className="block">
        <span className="label">{type === "photo" ? "Photo file" : "Video file"}</span>
        <input
          key={type}
          type="file"
          name="file"
          accept={type === "photo" ? "image/*" : "video/mp4,video/webm,video/quicktime"}
          className="input mt-2 file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-3 file:py-1 file:text-sm"
        />
      </label>

      {type === "video" && (
        <label className="block">
          <span className="label">…or YouTube / Vimeo link</span>
          <input name="url" type="url" placeholder="https://youtube.com/watch?v=…" className="input mt-2" />
        </label>
      )}

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
      <Submit pendingText="Uploading…">Publish</Submit>
    </form>
  );
}
