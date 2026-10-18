/* eslint-disable @next/next/no-img-element -- uploaded media */
import Link from "next/link";
import { listCategories, listPosts } from "@/lib/db";
import { deletePost } from "@/lib/admin-actions";
import { date, videoThumb } from "@/lib/format";
import { ConfirmSubmit } from "@/components/submit";
import { CategoryField } from "./category-field";
import { PostForm } from "./post-form";

export default async function AdminPosts() {
  const [posts, categories] = await Promise.all([listPosts(), listCategories()]);

  return (
    <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
      {/* Suggestions for every category field on this page */}
      <datalist id="post-categories">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>
      <section>
        <h1 className="text-3xl font-semibold tracking-tighter">New post</h1>
        <p className="mt-2 text-sm text-muted">Share a photo or a video to the gallery.</p>
        <PostForm />
      </section>

      <section>
        <p className="label mb-4">{posts.length} posts</p>
        <ul className="divide-y divide-line border-y border-line">
          {posts.map((p) => {
            const thumb = p.type === "photo" ? p.media_url : videoThumb(p.media_url);
            return (
              <li key={p.id} className="flex items-center gap-4 py-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <video src={`${p.media_url}#t=0.1`} muted preload="metadata" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/gallery/${p.id}`} className="block truncate font-medium hover:underline">
                    {p.title || "Untitled"}
                  </Link>
                  <p className="label mt-1">{p.type} · {date(p.created_at)}</p>
                </div>
                <CategoryField id={p.id} value={p.category ?? ""} />
                <form action={deletePost}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmSubmit message="Delete this post?">Delete</ConfirmSubmit>
                </form>
              </li>
            );
          })}
          {posts.length === 0 && <li className="py-10 text-center text-sm text-muted">No posts yet.</li>}
        </ul>
      </section>
    </div>
  );
}
