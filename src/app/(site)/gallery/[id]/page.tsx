import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/db";
import { date } from "@/lib/format";
import { PostMedia } from "@/components/media";

export async function generateMetadata({ params }: PageProps<"/gallery/[id]">) {
  const post = await getPost((await params).id);
  return { title: post?.title || "Post" };
}

export default async function PostPage({ params }: PageProps<"/gallery/[id]">) {
  const post = await getPost((await params).id);
  if (!post) notFound();

  return (
    <article className="container-x pt-10">
      <Link href="/gallery" className="text-sm text-muted hover:text-foreground">← Gallery</Link>
      <div className="mt-8">
        <PostMedia post={post} />
      </div>
      <div className="mx-auto mt-10 max-w-2xl">
        <p className="label">
          {post.category && (
            <>
              <Link href={`/gallery?category=${encodeURIComponent(post.category)}`} className="hover:text-foreground">
                {post.category}
              </Link>
              {" · "}
            </>
          )}
          {post.type} · {date(post.created_at)}
        </p>
        {post.title && <h1 className="mt-3 text-3xl font-semibold tracking-tight">{post.title}</h1>}
        {post.caption && <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">{post.caption}</p>}
      </div>
    </article>
  );
}
