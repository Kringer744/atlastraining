"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export function AtlasCoach({
  message,
  variant = "default",
  className,
}: {
  message: string;
  variant?: "default" | "energy" | "compact" | "hero";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <Image
          src="/icons/mascote-icon.png"
          alt="Atlas"
          width={28}
          height={28}
          className="rounded-full object-cover shrink-0"
        />
        <span className="text-atlas-muted italic">{message}</span>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className={cn("atlas-card relative overflow-hidden", className)}>
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 80% 50%, rgba(198,255,0,0.18), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <Image
            src="/icons/mascote-hero.png"
            alt="Atlas mascote"
            width={84}
            height={160}
            className="object-contain shrink-0"
          />
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.3em] text-atlas-energy font-semibold">
              Coach Atlas
            </div>
            <div className="mt-1 text-sm leading-snug">{message}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "atlas-card flex items-start gap-3",
        variant === "energy" && "bg-atlas-energy/10 border-atlas-energy/30",
        className,
      )}
    >
      <Image
        src="/icons/mascote-icon.png"
        alt="Atlas"
        width={48}
        height={48}
        className="rounded-2xl object-cover shrink-0 ring-2 ring-atlas-energy/40"
      />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.25em] text-atlas-energy font-semibold">
          Coach Atlas
        </div>
        <div className="mt-1 text-sm leading-snug">{message}</div>
      </div>
    </div>
  );
}
