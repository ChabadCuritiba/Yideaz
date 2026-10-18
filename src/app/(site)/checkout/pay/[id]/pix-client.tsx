"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3">
      <p className="break-all rounded-xl border border-line bg-surface p-3 text-left font-mono text-xs text-muted">{code}</p>
      <button
        type="button"
        className="btn mt-3 w-full"
        onClick={async () => {
          await navigator.clipboard.writeText(code).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }}
      >
        {copied ? "Copied ✓" : "Copy Pix code"}
      </button>
    </div>
  );
}

/** Checks every few seconds and moves on as soon as the payment arrives. */
export function PaymentWatcher({ orderId }: { orderId: string }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}/status`, { cache: "no-store" }).catch(() => null);
      const data = await res?.json().catch(() => null);
      if (data?.status === "paid") {
        clearInterval(timer);
        router.replace(`/checkout/success?order=${orderId}`);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [orderId, router]);

  return (
    <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
      <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
      Waiting for payment — this page updates automatically.
    </p>
  );
}
