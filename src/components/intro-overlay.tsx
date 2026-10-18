"use client";

import { useState } from "react";

export function IntroOverlay() {
  const [done, setDone] = useState(false);
  const [skipping, setSkipping] = useState(false);
  if (done) return null;

  return (
    <div
      className={`intro ${skipping ? "intro-skip" : ""}`}
      aria-hidden
      onClick={() => setSkipping(true)}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setDone(true);
      }}
    >
      <p className="intro-logo">
        yideaz<span className="intro-dot">.</span>
      </p>
      <p className="intro-tagline">
        Need Ideas? <span>Be Yideaz</span>
      </p>
    </div>
  );
}
