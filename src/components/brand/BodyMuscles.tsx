"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Catálogo de grupos musculares — chave usada no banco, label em PT
export const MUSCLE_GROUPS = [
  { key: "peito", label: "Peito", side: "front" },
  { key: "ombros", label: "Ombros", side: "both" },
  { key: "biceps", label: "Bíceps", side: "front" },
  { key: "antebraco", label: "Antebraço", side: "both" },
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

// Silhueta de corpo atlético — viewBox 220x520
// Outline base + paths individuais por grupo muscular (sobrepostos pra destacar).

const BODY_OUTLINE_FRONT = `
M110 24
C97 24 87 34 87 48
C87 57 91 65 96 70
C96 75 92 78 88 82
C72 86 60 95 55 110
C50 124 50 138 50 152
C50 168 53 184 56 200
C58 215 60 230 60 245
C60 255 62 265 64 274
C66 285 68 295 70 308
C72 322 74 335 76 348
C77 360 78 374 80 388
C81 405 83 422 85 440
C86 460 88 478 90 494
C91 502 92 508 94 512
L116 512
C118 508 119 502 120 494
C122 478 124 460 125 440
C127 422 129 405 130 388
C132 374 133 360 134 348
C136 335 138 322 140 308
C142 295 144 285 146 274
C148 265 150 255 150 245
C150 230 152 215 154 200
C157 184 160 168 160 152
C160 138 160 124 155 110
C150 95 138 86 122 82
C118 78 114 75 114 70
C119 65 123 57 123 48
C123 34 113 24 110 24Z`;

const BODY_OUTLINE_BACK = BODY_OUTLINE_FRONT; // simétrico

// FRONT muscle paths
const FRONT: Record<string, string> = {
  ombros: `
M62 86 C55 92 53 102 54 112 C56 116 64 116 72 112 L78 100 L80 84 C76 84 70 84 62 86 Z
M158 86 C165 92 167 102 166 112 C164 116 156 116 148 112 L142 100 L140 84 C144 84 150 84 158 86 Z`,
  peito: `
M82 92 C90 98 100 102 109 104 L109 132 C100 138 88 138 80 132 C75 122 75 108 82 92 Z
M138 92 C130 98 120 102 111 104 L111 132 C120 138 132 138 140 132 C145 122 145 108 138 92 Z`,
  biceps: `
M54 116 C50 122 48 138 50 156 C56 164 64 162 66 154 L68 132 L66 116 C62 114 58 114 54 116 Z
M166 116 C170 122 172 138 170 156 C164 164 156 162 154 154 L152 132 L154 116 C158 114 162 114 166 116 Z`,
  antebraco: `
M50 162 C48 178 48 200 52 218 C58 222 64 218 66 212 L68 188 L66 164 C62 164 56 162 50 162 Z
M170 162 C172 178 172 200 168 218 C162 222 156 218 154 212 L152 188 L154 164 C158 164 164 162 170 162 Z`,
  abdomen: `
M92 138 L128 138 L128 158 L92 158 Z
M92 162 L128 162 L128 180 L92 180 Z
M92 184 L128 184 L128 204 L92 204 Z
M92 208 L128 208 L128 226 L94 226 L92 220 Z`,
  quadriceps: `
M82 250 C76 270 74 296 76 326 L100 328 L102 252 C95 248 88 248 82 250 Z
M138 250 C144 270 146 296 144 326 L120 328 L118 252 C125 248 132 248 138 250 Z`,
  panturrilha: `
M84 348 C80 372 78 396 82 420 L102 420 L102 348 Z
M136 348 C140 372 142 396 138 420 L118 420 L118 348 Z`,
};

// BACK muscle paths
const BACK: Record<string, string> = {
  trapezio: `
M88 80 C100 86 120 86 132 80 L128 100 C120 104 100 104 92 100 Z`,
  ombros: `
M62 86 C55 92 53 102 54 112 C56 116 64 116 72 112 L78 100 L80 84 C76 84 70 84 62 86 Z
M158 86 C165 92 167 102 166 112 C164 116 156 116 148 112 L142 100 L140 84 C144 84 150 84 158 86 Z`,
  costas: `
M84 108 C92 105 100 104 110 104 C120 104 128 105 136 108 L136 158 C128 160 120 162 110 162 C100 162 92 160 84 158 Z`,
  triceps: `
M54 116 C50 122 48 138 50 156 C56 164 64 162 66 154 L68 132 L66 116 C62 114 58 114 54 116 Z
M166 116 C170 122 172 138 170 156 C164 164 156 162 154 154 L152 132 L154 116 C158 114 162 114 166 116 Z`,
  antebraco: `
M50 162 C48 178 48 200 52 218 C58 222 64 218 66 212 L68 188 L66 164 C62 164 56 162 50 162 Z
M170 162 C172 178 172 200 168 218 C162 222 156 218 154 212 L152 188 L154 164 C158 164 164 162 170 162 Z`,
  lombar: `
M90 164 L130 164 L130 200 L90 200 Z`,
  gluteos: `
M82 208 C76 220 76 240 86 250 C100 254 110 240 110 220 Z
M138 208 C144 220 144 240 134 250 C120 254 110 240 110 220 Z`,
  posterior: `
M82 254 C76 280 74 304 78 328 L100 328 L102 256 C95 252 88 252 82 254 Z
M138 254 C144 280 146 304 142 328 L120 328 L118 256 C125 252 132 252 138 254 Z`,
  panturrilha: `
M84 348 C80 372 78 396 82 420 L102 420 L102 348 Z
M136 348 C140 372 142 396 138 420 L118 420 L118 348 Z`,
};

function isHit(
  key: string,
  active: Set<string>,
): boolean {
  // panturrilha aparece nas duas vistas
  return active.has(key);
}

export function BodyMuscles({
  selected = [],
  onChange,
  side: forcedSide,
  size = 220,
}: {
  selected?: string[];
  onChange?: (next: string[]) => void;
  side?: "front" | "back";
  size?: number;
}) {
  const [side, setSide] = useState<"front" | "back">(forcedSide ?? "front");
  const active = new Set(selected);
  const interactive = !!onChange;
  const paths = side === "front" ? FRONT : BACK;

  function toggle(key: string) {
    if (!onChange) return;
    const next = active.has(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];
    onChange(next);
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
        viewBox="0 0 220 520"
        width={size}
        height={(size * 520) / 220}
        className="select-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      >
        <defs>
          <linearGradient id="atlasBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1F1F26" />
            <stop offset="1" stopColor="#15151A" />
          </linearGradient>
          <linearGradient id="atlasMuscleActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D9FF3D" />
            <stop offset="1" stopColor="#A6D900" />
          </linearGradient>
          <filter id="muscleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Silhueta base */}
        <path
          d={side === "front" ? BODY_OUTLINE_FRONT : BODY_OUTLINE_BACK}
          fill="url(#atlasBody)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />

        {/* Cabeça (decorativa) */}
        <ellipse cx="110" cy="40" rx="20" ry="22" fill="url(#atlasBody)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

        {/* Sombras de definição (sempre visíveis) */}
        <g opacity="0.18" fill="rgba(255,255,255,0.06)">
          {Object.entries(paths).map(([key, d]) => (
            <path key={`shadow-${key}`} d={d} />
          ))}
        </g>

        {/* Grupos musculares — destacados se ativos */}
        {Object.entries(paths).map(([key, d]) => {
          const hit = isHit(key, active);
          const clickable = interactive;
          return (
            <path
              key={key}
              d={d}
              fill={hit ? "url(#atlasMuscleActive)" : "transparent"}
              stroke={hit ? "#C6FF00" : "rgba(255,255,255,0.10)"}
              strokeWidth={hit ? 1.5 : 1}
              filter={hit ? "url(#muscleGlow)" : undefined}
              className={cn("transition-all", clickable && "cursor-pointer")}
              onClick={clickable ? () => toggle(key) : undefined}
            />
          );
        })}
      </svg>

      {interactive && (
        <div className="flex flex-wrap gap-1.5 max-w-[300px] justify-center">
          {MUSCLE_GROUPS.filter((m) => m.side === side || m.side === "both").map((m) => (
            <button
              type="button"
              key={m.key}
              onClick={() => toggle(m.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs border transition",
                active.has(m.key)
                  ? "bg-atlas-energy text-black border-atlas-energy font-semibold shadow-glow"
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
