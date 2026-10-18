import Link from "next/link";
import type { Metadata } from "next";
import { listCategories, listPosts, type Post } from "@/lib/db";
import { Empty, PostCard } from "@/components/media";

export const metadata: Metadata = { title: "Gallery" };

const types = [
  { label: "All", value: undefined },
  { label: "Photos", value: "photo" },
  { label: "Videos", value: "video" },
] as const;

function galleryHref(type?: string, category?: string) {
  const q = new URLSearchParams();
  if (category) q.set("category", category);
  if (type) q.set("type", type);
  const s = q.toString();
  return s ? `/gallery?${s}` : "/gallery";
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${
        active ? "bg-foreground text-background" : "border border-line text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function Gallery({ searchParams }: PageProps<"/gallery">) {
  const { type, category } = await searchParams;
  const activeType = type === "photo" || type === "video" ? (type as Post["type"]) : undefined;
  const categories = await listCategories();
  const activeCategory = categories.find((c) => c.toLowerCase() === String(category ?? "").toLowerCase());
  const posts = await listPosts({ type: activeType, category: activeCategory });

  return (
    <div className="container-x pt-16">
      <p className="label">{activeCategory ? "Idea category" : "Gallery"}</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-6xl">
        {activeCategory ?? "Ideas for everything."}
      </h1>

      {categories.length > 0 && (
        <div className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip href={galleryHref(activeType)} active={!activeCategory}>All ideas</Chip>
          {categories.map((c) => (
            <Chip key={c} href={galleryHref(activeType, c)} active={c === activeCategory}>{c}</Chip>
          ))}
        </div>
      )}

      <div className={`${categories.length > 0 ? "mt-3" : "mt-10"} mb-10 flex gap-2`}>
        {types.map((t) => (
          <Chip key={t.label} href={galleryHref(t.value, activeCategory)} active={activeType === t.value}>{t.label}</Chip>
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
