"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Catálogo de grupos musculares — chave usada no banco, label em PT
export const MUSCLE_GROUPS = [
  { key: "peito", label: "Peito", side: "front" },
  { key: "ombros", label: "Ombros", side: "front" },
  { key: "biceps", label: "Bíceps", side: "front" },
  { key: "antebraco", label: "Antebraço", side: "front" },
  { key: "abdomen", label: "Abdômen", side: "front" },
  { key: "quadriceps", label: "Quadríceps", side: "front" },
  { key: "panturrilha", label: "Panturrilha", side: "both" },
  { key: "costas", label: "Costas", side: "back" },
  { key: "trapezio", label: "Trapézio", side: "back" },
  { key: "triceps", label: "Tríceps", side: "back" },
  { key: "lombar", label: "Lombar", side: "back" },
  { key: "gluteos", label: "Glúteos", side: "back" },
  { key: "posterior", label: "Posterior", side: "back" },
] as const;

export type MuscleKey = (typeof MUSCLE_GROUPS)[number]["key"];

// Path de cada grupo muscular no SVG do corpo (escala 200x400)
// Coordenadas aproximadas — formas estilizadas, não anatomicamente precisas.
const PATHS_FRONT: Record<string, string> = {
  // Cabeça (decorativa, não selecionável)
  head: "M100 14 a18 20 0 1 0 0.1 0 z M82 50 q18 8 36 0 q0 14 -18 18 q-18 -4 -18 -18 z",
  // Pescoço pra tronco
  torso: "M82 50 q18 10 36 0 L132 90 Q132 200 100 215 Q68 200 68 90 Z",
  ombros: "M62 70 Q56 60 60 54 Q72 50 82 60 L82 90 L62 90 Z M138 70 Q144 60 140 54 Q128 50 118 60 L118 90 L138 90 Z",
  peito: "M82 78 Q100 86 118 78 L118 110 Q100 122 82 110 Z",
  abdomen: "M84 118 L116 118 L114 175 L100 185 L86 175 Z",
  biceps: "M58 88 Q52 92 56 122 Q60 138 70 138 L70 90 Z M142 88 Q148 92 144 122 Q140 138 130 138 L130 90 Z",
  antebraco: "M56 140 Q52 158 60 180 Q68 184 72 178 Q70 156 70 142 Z M144 140 Q148 158 140 180 Q132 184 128 178 Q130 156 130 142 Z",
  quadriceps: "M76 218 Q70 250 76 300 L94 300 L96 220 Z M124 218 Q130 250 124 300 L106 300 L104 220 Z",
  panturrilha_front: "M82 310 Q78 340 84 372 L96 372 L96 310 Z M118 310 Q122 340 116 372 L104 372 L104 310 Z",
};

const PATHS_BACK: Record<string, string> = {
  head: "M100 14 a18 20 0 1 0 0.1 0 z M82 50 q18 8 36 0 q0 12 -18 18 q-18 -6 -18 -18 z",
  torso: "M82 50 q18 10 36 0 L132 90 Q132 200 100 215 Q68 200 68 90 Z",
  trapezio: "M82 50 Q100 60 118 50 L114 78 Q100 80 86 78 Z",
  ombros: "M62 70 Q56 60 60 54 Q72 50 82 60 L82 88 L62 88 Z M138 70 Q144 60 140 54 Q128 50 118 60 L118 88 L138 88 Z",
  costas: "M82 80 L118 80 L118 140 L82 140 Z",
  lombar: "M84 142 L116 142 L114 168 L86 168 Z",
  triceps: "M58 88 Q52 96 56 124 Q60 138 70 138 L70 90 Z M142 88 Q148 96 144 124 Q140 138 130 138 L130 90 Z",
  gluteos: "M78 170 Q72 200 90 210 Q100 212 100 188 Z M122 170 Q128 200 110 210 Q100 212 100 188 Z",
  posterior: "M76 215 Q70 250 76 300 L94 300 L96 220 Z M124 215 Q130 250 124 300 L106 300 L104 220 Z",
  panturrilha_back: "M82 310 Q78 340 84 372 L96 372 L96 310 Z M118 310 Q122 340 116 372 L104 372 L104 310 Z",
};

function muscleColor(key: string, active: Set<string>, interactive: boolean) {
  const isActive = active.has(key) || (key === "panturrilha_front" && active.has("panturrilha")) || (key === "panturrilha_back" && active.has("panturrilha"));
  if (isActive) return "fill-atlas-energy stroke-atlas-energy-dim";
  if (interactive) return "fill-atlas-balance stroke-white/15 hover:fill-white/15";
  return "fill-atlas-balance stroke-white/10";
}

export function BodyMuscles({
  selected = [],
  onChange,
  side: forcedSide,
  size = 240,
}: {
  selected?: string[];
  onChange?: (next: string[]) => void;
  side?: "front" | "back";
  size?: number;
}) {
  const [side, setSide] = useState<"front" | "back">(forcedSide ?? "front");
  const active = new Set(selected);
  const interactive = !!onChange;

  function toggle(key: string) {
    if (!onChange) return;
    const next = active.has(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];
    onChange(next);
  }

  // mapear chaves por side
  const paths = side === "front" ? PATHS_FRONT : PATHS_BACK;

  // Quais chaves visíveis nesse side (excluir 'head' e 'torso' do click)
  const clickable: string[] = [];
  for (const m of MUSCLE_GROUPS) {
    if (m.side === side || m.side === "both") clickable.push(m.key);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {!forcedSide && (
        <div className="inline-flex rounded-full bg-white/5 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setSide("front")}
            className={cn(
              "px-3 py-1 rounded-full transition",
              side === "front"
                ? "bg-atlas-energy text-black font-semibold"
                : "text-atlas-muted",
            )}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setSide("back")}
            className={cn(
              "px-3 py-1 rounded-full transition",
              side === "back"
                ? "bg-atlas-energy text-black font-semibold"
                : "text-atlas-muted",
            )}
          >
            Costas
          </button>
        </div>
      )}

      <svg
        viewBox="0 0 200 400"
        width={size}
        height={(size * 400) / 200}
        className="select-none"
      >
        {/* contorno do corpo */}
        <path d={paths.head} className="fill-atlas-balance stroke-white/15" strokeWidth="1.5" />
        {paths.torso && (
          <path d={paths.torso} className="fill-atlas-balance/40 stroke-white/10" strokeWidth="1" />
        )}

        {/* grupos musculares */}
        {Object.entries(paths)
          .filter(([key]) => key !== "head" && key !== "torso")
          .map(([key, d]) => {
            const baseKey = key.replace(/_front|_back/, "");
            const isClickable = clickable.includes(baseKey) && interactive;
            return (
              <path
                key={key}
                d={d}
                className={cn(
                  muscleColor(key, active, interactive),
                  "transition",
                  isClickable && "cursor-pointer",
                )}
                strokeWidth="1.2"
                onClick={isClickable ? () => toggle(baseKey) : undefined}
              />
            );
          })}
      </svg>

      {/* legenda de chips quando interativo */}
      {interactive && (
        <div className="flex flex-wrap gap-1.5 max-w-[280px] justify-center">
          {MUSCLE_GROUPS.filter((m) => m.side === side || m.side === "both").map((m) => (
            <button
              type="button"
              key={m.key}
              onClick={() => toggle(m.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs border transition",
                active.has(m.key)
                  ? "bg-atlas-energy text-black border-atlas-energy font-semibold"
                  : "bg-white/5 text-atlas-muted border-white/10 hover:bg-white/10",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function muscleLabels(keys: string[]): string {
  const dict: Record<string, string> = {};
  for (const m of MUSCLE_GROUPS) dict[m.key] = m.label;
  return keys.map((k) => dict[k] ?? k).join(", ");
}
