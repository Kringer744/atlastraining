"use client";

import { AtlasLogo } from "@/components/brand/AtlasLogo";
import { cn } from "@/lib/utils";

export function AtlasCoach({
  message,
  variant = "default",
  className,
}: {
  message: string;
  variant?: "default" | "energy" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <AtlasLogo size={20} />
        <span className="text-atlas-muted italic">{message}</span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "atlas-card flex items-start gap-3",
        variant === "energy" &&
          "bg-atlas-energy/10 border-atlas-energy/30",
        className,
      )}
    >
      <div className="rounded-full bg-atlas-energy/20 border border-atlas-energy/40 p-2 shrink-0">
        <AtlasLogo size={20} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-atlas-energy font-semibold">
          Coach Atlas
        </div>
        <div className="mt-1 text-sm leading-snug">{message}</div>
      </div>
    </div>
  );
}
