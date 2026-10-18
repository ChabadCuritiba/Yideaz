/* eslint-disable @next/next/no-img-element -- media is user-uploaded and served from /media */
import Link from "next/link";
import type { Post, Product } from "@/lib/db";
import { embedUrl, money, videoThumb } from "@/lib/format";

export function PostCard({ post }: { post: Post }) {
  const thumb = post.type === "photo" ? post.media_url : videoThumb(post.media_url);
  return (
    <Link href={`/gallery/${post.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
        {thumb ? (
          <img
            src={thumb}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <video
            src={`${post.media_url}#t=0.1`}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        )}
        {post.type === "video" && (
          <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-3.5 w-3.5 fill-current" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}
      </div>
      {post.title && <p className="mt-3 text-sm font-medium">{post.title}</p>}
    </Link>
  );
}

export function PostMedia({ post }: { post: Post }) {
  if (post.type === "photo") {
    return <img src={post.media_url} alt={post.title} className="mx-auto max-h-[80vh] w-auto rounded-2xl" />;
  }
  const embed = embedUrl(post.media_url);
  if (embed) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-surface">
        <iframe
          src={embed}
          title={post.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return <video src={post.media_url} controls playsInline className="mx-auto max-h-[80vh] w-full rounded-2xl bg-black" />;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/shop/${product.id}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-2xl bg-surface">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-4 text-sm">
        <p className="font-medium">{product.name}</p>
        <p className="text-muted">{product.stock > 0 ? money(product.price_cents) : "Sold out"}</p>
      </div>
    </Link>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line py-20 text-center text-sm text-muted">{children}</p>;
}
