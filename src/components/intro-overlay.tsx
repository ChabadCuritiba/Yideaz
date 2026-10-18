/* eslint-disable @next/next/no-img-element -- static brand artwork */
"use client";

import { useState } from "react";

const LOGO = "/brand/logo.webp";

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
      <div className="intro-mark" style={{ "--logo": `url(${LOGO})` } as React.CSSProperties}>
        {/* Light thrown by the bulb once it switches on */}
        <span className="intro-halo" />
        {/* Unlit logo */}
        <img src={LOGO} alt="" className="intro-off" />
        {/* Full-colour logo, revealed as the current flows from plug to bulb */}
        <img src={LOGO} alt="" className="intro-on" />
        {/* White band of light running through the logo's shape */}
        <span className="intro-sweep" />
        {/* Filament glow over the bulb glass */}
        <span className="intro-filament" />
      </div>
      <p className="intro-tagline">
        Need Ideas? <span>Get Yideaz</span>
      </p>
    </div>
  );
}
