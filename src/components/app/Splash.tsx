"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const DURATION = 1900; // total visível em ms (animação + fade-out)

export function Splash() {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // já vi splash nessa sessão? não mostra de novo
    if (sessionStorage.getItem("atlas_splash") === "1") {
      setRemoved(true);
      return;
    }
    sessionStorage.setItem("atlas_splash", "1");

    const fade = setTimeout(() => setHidden(true), DURATION - 350);
    const gone = setTimeout(() => setRemoved(true), DURATION);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      className={
        "fixed inset-0 z-[100] flex items-center justify-center bg-atlas-focus transition-opacity duration-500 " +
        (hidden ? "opacity-0 pointer-events-none" : "opacity-100")
      }
      aria-hidden={hidden}
    >
      <div className="atlas-splash-content">
        <div className="relative">
          <Image
            src="/icons/app-icon.png"
            alt="Atlas"
            width={120}
            height={120}
            priority
            className="rounded-3xl atlas-splash-logo"
          />
          <span className="atlas-splash-glow" />
        </div>
        <div className="atlas-splash-wordmark mt-5 text-center">
          <div className="text-xl font-bold tracking-[0.4em]">ATLAS</div>
          <div className="text-[10px] tracking-[0.5em] text-atlas-muted mt-1">
            TRAINING
          </div>
        </div>
      </div>
    </div>
  );
}
