import Link from "next/link";
import { listPosts, listProducts } from "@/lib/db";
import { Empty, PostCard, ProductCard } from "@/components/media";

export default async function Home() {
  const [posts, products] = await Promise.all([listPosts({ limit: 6 }), listProducts({ limit: 4 })]);

  return (
    <>
      <section className="container-x pb-20 pt-24 sm:pt-36">
        <p className="label">Ideas · Videos · Shop</p>
        <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tighter sm:text-7xl md:text-8xl">
          Ideas, captured<span className="text-muted">.</span>
        </h1>
        <p className="mt-8 max-w-md text-lg text-muted">
          A place for Jewish ideas — videos and photos, and a shop to bring it to life.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/gallery" className="btn">Explore the gallery</Link>
          <Link href="/shop" className="btn-ghost">Visit the shop</Link>
        </div>
      </section>

      <Section title="Latest" href="/gallery" cta="View all">
        {posts.length ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        ) : (
          <Empty>Nothing posted yet.</Empty>
        )}
      </Section>

      <Section title="From the shop" href="/shop" cta="Shop all">
        {products.length ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <Empty>The shop opens soon.</Empty>
        )}
      </Section>
    </>
  );
}

function Section({ title, href, cta, children }: { title: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <section className="container-x mt-16 border-t border-line pt-10">
      <div className="mb-8 flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <Link href={href} className="text-sm text-muted transition hover:text-foreground">{cta} →</Link>
      </div>
      {children}
    </section>
  );
}
