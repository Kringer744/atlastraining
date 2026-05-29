"use client";

import { useState, useEffect } from "react";
import { Play, X, ExternalLink, Search } from "lucide-react";
import { exerciseVideoId, exerciseSearchUrl } from "@/lib/exercise-videos";
import { cn } from "@/lib/utils";

/**
 * Botão "▶ vídeo" ao lado do nome do exercício.
 * - Se tem ID curado: abre modal com YouTube embed
 * - Se não: link pra busca no YouTube em nova aba
 */
export function ExerciseVideo({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const videoId = exerciseVideoId(name);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  // Bloqueia scroll do body quando modal aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!videoId) {
    return (
      <a
        href={exerciseSearchUrl(name)}
        target="_blank"
        rel="noreferrer"
        title="Buscar vídeo no YouTube"
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 text-atlas-muted hover:text-atlas-energy hover:border-atlas-energy/40 transition shrink-0",
          size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Search size={size === "sm" ? 10 : 12} />
        buscar
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        title="Ver vídeo de execução"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-atlas-energy/15 border border-atlas-energy/30 text-atlas-energy hover:bg-atlas-energy/25 transition shrink-0 font-medium",
          size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        )}
      >
        <Play size={size === "sm" ? 10 : 12} fill="currentColor" />
        vídeo
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn overscroll-contain"
          style={{
            height: "100dvh",
            paddingTop: "max(env(safe-area-inset-top), 0.5rem)",
            paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
          }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Vídeo: ${name}`}
        >
          <div
            className="w-full max-w-3xl flex flex-col max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3 shrink-0">
              <div className="text-atlas-contrast font-semibold truncate pr-3 text-sm sm:text-base">
                {name}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar vídeo"
                className="rounded-full bg-white/10 border border-white/20 p-2 text-white hover:bg-white/20 active:scale-95 transition shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="relative w-full bg-black rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 shadow-glow"
              style={{ aspectRatio: "16 / 9" }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&playsinline=1&fs=1`}
                title={`Execução: ${name}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-atlas-muted shrink-0">
              <span className="truncate">Vídeo de referência — siga sua técnica.</span>
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noreferrer"
                className="text-atlas-energy inline-flex items-center gap-1 hover:underline shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={12} /> YouTube
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
