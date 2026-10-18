import Link from "next/link";
import type { Metadata } from "next";
import { listPosts, type Post } from "@/lib/db";
import { Empty, PostCard } from "@/components/media";

export const metadata: Metadata = { title: "Gallery" };

const filters = [
  { label: "All", value: undefined },
  { label: "Photos", value: "photo" },
  { label: "Videos", value: "video" },
] as const;

export default async function Gallery({ searchParams }: PageProps<"/gallery">) {
  const { type } = await searchParams;
  const active = type === "photo" || type === "video" ? (type as Post["type"]) : undefined;
  const posts = await listPosts({ type: active });

  return (
    <div className="container-x pt-16">
      <p className="label">Gallery</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-6xl">Everything, in order.</h1>
      <div className="mt-10 mb-10 flex gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/gallery?type=${f.value}` : "/gallery"}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              active === f.value ? "bg-foreground text-background" : "border border-line text-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>
      {posts.length ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      ) : (
        <Empty>Nothing here yet.</Empty>
      )}
    </div>
  );
}
