"use client";

import { setPostCategory } from "@/lib/admin-actions";

/** Inline category editor for an existing post; saves when the field loses focus or on Enter. */
export function CategoryField({ id, value }: { id: string; value: string }) {
  return (
    <form action={setPostCategory}>
      <input type="hidden" name="id" value={id} />
      <input
        name="category"
        defaultValue={value}
        list="post-categories"
        placeholder="Idea category"
        aria-label="Idea category"
        className="w-36 rounded-full border border-transparent bg-transparent px-3 py-1 text-xs text-muted outline-none transition placeholder:text-muted/60 hover:border-line focus:border-foreground focus:text-foreground"
        onBlur={(e) => {
          if (e.currentTarget.value.trim() !== value) e.currentTarget.form?.requestSubmit();
        }}
      />
    </form>
  );
}
