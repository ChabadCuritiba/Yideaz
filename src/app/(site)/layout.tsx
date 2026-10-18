import Link from "next/link";
import { CartProvider } from "@/components/cart";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <CartProvider>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="mt-24 border-t border-line">
        <div className="container-x flex flex-col gap-2 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Yideaz</span>
          <div className="flex gap-6">
            <Link href="/gallery" className="hover:text-foreground">Gallery</Link>
            <Link href="/shop" className="hover:text-foreground">Shop</Link>
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
          </div>
        </div>
      </footer>
    </CartProvider>
  );
}
