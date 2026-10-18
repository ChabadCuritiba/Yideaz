import { syncOrder } from "@/lib/payments";

// Polled by the Pix page. Order ids are long random strings, and only the status is returned.
export async function GET(_req: Request, ctx: RouteContext<"/api/orders/[id]/status">) {
  const order = await syncOrder((await ctx.params).id);
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ status: order.status }, { headers: { "Cache-Control": "no-store" } });
}
