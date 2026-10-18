"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart";

const links = [
  { href: "/gallery", label: "Gallery" },
  { href: "/shop", label: "Shop" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          yideaz<span className="text-muted">.</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname.startsWith(l.href) ? "text-foreground" : "text-muted transition hover:text-foreground"}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/cart" className="relative text-muted transition hover:text-foreground" aria-label="Cart">
            Cart
            {count > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-medium text-background">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
