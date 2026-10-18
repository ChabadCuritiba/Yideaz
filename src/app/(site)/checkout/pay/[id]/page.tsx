/* eslint-disable @next/next/no-img-element -- QR code is a data URL from Asaas */
import { notFound, redirect } from "next/navigation";
import { getPixQrCode } from "@/lib/asaas";
import { money } from "@/lib/format";
import { syncOrder } from "@/lib/payments";
import { ClearCart } from "../../success/clear-cart";
import { CopyCode, PaymentWatcher } from "./pix-client";

export const metadata = { title: "Pay with Pix" };

export default async function PixPage({ params }: PageProps<"/checkout/pay/[id]">) {
  const { id } = await params;
  const order = await syncOrder(id);
  if (!order || !order.payment_id) notFound();
  if (order.status === "paid") redirect(`/checkout/success?order=${id}`);

  const pix = await getPixQrCode(order.payment_id).catch(() => null);

  return (
    <div className="container-x max-w-md pt-16 text-center">
      <ClearCart />
      <p className="label">Order #{id.slice(0, 8).toUpperCase()}</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tighter">Pay with Pix</h1>
      <p className="mt-3 text-2xl tabular-nums">{money(order.total_cents)}</p>

      {pix ? (
        <>
          <div className="mx-auto mt-8 w-64 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-line">
            <img src={`data:image/png;base64,${pix.encodedImage}`} alt="Pix QR code" className="h-full w-full" />
          </div>
          <p className="mt-6 text-sm text-muted">Open your bank app, choose Pix and scan the code — or copy it:</p>
          <CopyCode code={pix.payload} />
          <PaymentWatcher orderId={id} />
        </>
      ) : (
        <p className="mt-8 text-sm text-red-500">
          The Pix code couldn’t be loaded. Refresh the page, or contact us with your order number.
        </p>
      )}
    </div>
  );
}
