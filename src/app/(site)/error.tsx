"use client";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-x max-w-xl pt-24 text-center">
      <p className="label">Something went wrong</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tighter">We’ll be right back.</h1>
      <p className="mt-6 text-muted">This page couldn’t load just now. Please try again in a moment.</p>
      <button type="button" onClick={reset} className="btn mt-10">Try again</button>
      {/* Matches the error in the App Hosting logs */}
      {error.digest && <p className="label mt-10 normal-case tracking-normal">Error code: {error.digest}</p>}
    </div>
  );
}
