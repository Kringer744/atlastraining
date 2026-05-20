"use client";

import { useTransition } from "react";
import { Droplet, Undo2, Plus } from "lucide-react";

type LogEntry = { id: string; logged_at: string; amount_ml: number };

export function WaterTracker({
  goalMl,
  todayMl,
  todayLogs,
  onAdd,
  onUndo,
}: {
  goalMl: number;
  todayMl: number;
  todayLogs: LogEntry[];
  onAdd: (ml: number) => Promise<void>;
  onUndo: () => Promise<void>;
}) {
  const [pending, start] = useTransition();
  const pct = Math.min(100, Math.round((todayMl / goalMl) * 100));
  const remaining = Math.max(0, goalMl - todayMl);

  return (
    <div className="space-y-4">
      <div className="atlas-card flex items-center gap-4">
        {/* Garrafa SVG */}
        <div className="relative shrink-0">
          <svg width="80" height="160" viewBox="0 0 80 160" className="drop-shadow-[0_0_24px_rgba(80,180,255,0.25)]">
            <defs>
              <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#4FC3F7" />
                <stop offset="1" stopColor="#0288D1" />
              </linearGradient>
              <clipPath id="bottleClip">
                <path d="M28 20 L52 20 L52 36 Q60 40 60 60 L60 140 Q60 154 46 154 L34 154 Q20 154 20 140 L20 60 Q20 40 28 36 Z" />
              </clipPath>
            </defs>
            <path
              d="M28 20 L52 20 L52 36 Q60 40 60 60 L60 140 Q60 154 46 154 L34 154 Q20 154 20 140 L20 60 Q20 40 28 36 Z"
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
            />
            {/* nível da água */}
            <g clipPath="url(#bottleClip)">
              <rect
                x="0"
                y={20 + (134 * (100 - pct)) / 100}
                width="80"
                height="160"
                fill="url(#water)"
              />
              {/* ondinha decorativa */}
              {pct > 0 && pct < 100 && (
                <path
                  d={`M0 ${20 + (134 * (100 - pct)) / 100} Q20 ${15 + (134 * (100 - pct)) / 100} 40 ${20 + (134 * (100 - pct)) / 100} T80 ${20 + (134 * (100 - pct)) / 100} L80 160 L0 160 Z`}
                  fill="rgba(255,255,255,0.1)"
                />
              )}
            </g>
            {/* tampa */}
            <rect x="30" y="14" width="20" height="8" rx="2" fill="#1F1F26" stroke="rgba(255,255,255,0.2)" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white drop-shadow-lg">
              <div className="text-3xl font-bold tabular-nums">{pct}%</div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider text-atlas-muted">
            Hidratação hoje
          </div>
          <div className="text-2xl font-bold">
            {(todayMl / 1000).toFixed(2)} L
            <span className="text-atlas-muted text-base font-normal">
              {" "}/ {(goalMl / 1000).toFixed(1)} L
            </span>
          </div>
          <div className="text-xs text-atlas-muted mt-1">
            {pct >= 100
              ? "🎯 meta batida! hidratação top"
              : `Faltam ${remaining}ml`}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-atlas-muted mb-2 text-center">
          Toque pra adicionar
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[200, 300, 500].map((ml) => (
            <button
              key={ml}
              type="button"
              disabled={pending}
              onClick={() => start(() => onAdd(ml))}
              className="atlas-card-muted flex flex-col items-center py-3 hover:bg-atlas-energy/10 hover:border-atlas-energy/30 transition disabled:opacity-50"
            >
              <Droplet className="text-[#4FC3F7]" size={24} />
              <div className="mt-1 font-bold text-lg">{ml}</div>
              <div className="text-[10px] text-atlas-muted">ml</div>
            </button>
          ))}
        </div>
      </div>

      {todayLogs.length > 0 && (
        <div className="atlas-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wider text-atlas-muted">
              Registros de hoje · {todayLogs.length}
            </div>
            <button
              type="button"
              onClick={() => start(() => onUndo())}
              disabled={pending}
              className="atlas-btn-ghost text-xs py-1.5 px-3"
            >
              <Undo2 size={12} /> Desfazer
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {todayLogs.map((l) => (
              <div
                key={l.id}
                className="atlas-chip text-[#4FC3F7] border-[#4FC3F7]/30 bg-[#4FC3F7]/10"
              >
                <Droplet size={10} /> {l.amount_ml}ml
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
