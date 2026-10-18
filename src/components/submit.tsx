"use client";

import { useFormStatus } from "react-dom";

export function Submit({ children, pendingText = "Saving…", className = "btn" }: { children: React.ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function ConfirmSubmit({ children, message }: { children: React.ReactNode; message: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="text-sm text-muted hover:text-red-500"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
