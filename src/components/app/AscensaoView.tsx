import {
  Flag,
  Target,
  Dumbbell,
  Zap,
  Lock,
  Crown,
  Check,
  Mountain,
} from "lucide-react";
import { levelFromXp } from "@/lib/utils";

type StageDef = {
  num: number;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  xpUnlock: number;
};

function cumulativeXp(level: number) {
  let total = 0;
  for (let l = 1; l < level; l++) total += 250 + (l - 1) * 150;
  return total;
}

const STAGES: StageDef[] = [
  { num: 1, title: "INICIANTE",    icon: Flag,     xpUnlock: cumulativeXp(1) },
  { num: 2, title: "DISCIPLINA",   icon: Target,   xpUnlock: cumulativeXp(2) },
  { num: 3, title: "CONSISTÊNCIA", icon: Dumbbell, xpUnlock: cumulativeXp(3) },
  { num: 4, title: "PERFORMANCE",  icon: Zap,      xpUnlock: cumulativeXp(4) },
  { num: 5, title: "ELITE",        icon: Crown,    xpUnlock: cumulativeXp(5) },
  { num: 6, title: "SUPREMACIA",   icon: Crown,    xpUnlock: cumulativeXp(6) },
  { num: 7, title: "ATLAS",        icon: Mountain, xpUnlock: cumulativeXp(7) },
];

// Offsets em px pro zigzag — index 0 = topo (Atlas), index 6 = base (Iniciante)
// Padrão sinuoso: 0 → -55 → -85 → -55 → 0 → 55 → 85 → 55 → 0
const ZIGZAG = [0, 70, 95, 60, -10, -75, -95];

function stageStatus(stage: StageDef, currentLevel: number) {
  if (currentLevel > stage.num) return "completed" as const;
  if (currentLevel === stage.num) return "current" as const;
  return "locked" as const;
}

export function AscensaoView({
  xp,
  streakDays,
  achievementsUnlocked,
  achievementsTotal,
}: {
  xp: number;
  streakDays: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
}) {
  const lvl = levelFromXp(xp);
  const currentStage = Math.min(STAGES.length, lvl.level);
  const currentStageDef = STAGES[currentStage - 1];
  const progressPct = Math.round((lvl.intoLevel / lvl.neededForNext) * 100);

  // do topo (Atlas) pra base (Iniciante)
  const ordered = [...STAGES].reverse();

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="atlas-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-atlas-energy">
              Sua jornada
            </div>
            <h1 className="text-3xl font-bold tracking-tight mt-1">ASCENSÃO</h1>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-atlas-muted">
              Nível atual
            </div>
            <div className="text-3xl font-bold text-atlas-energy leading-none">
              {String(currentStage).padStart(2, "0")}
            </div>
            <div className="text-[11px] text-atlas-energy font-semibold tracking-wider">
              {currentStageDef.title}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-atlas-energy rounded-full shadow-glow transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-atlas-muted mt-1">
            <span>{xp.toLocaleString("pt-BR")} XP</span>
            <span>
              {currentStage < STAGES.length
                ? `${lvl.neededForNext - lvl.intoLevel} XP pro próximo`
                : "Nível máximo"}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="atlas-card-muted py-2 text-center">
            <div className="text-[10px] uppercase tracking-wider text-atlas-muted">
              Sequência
            </div>
            <div className="text-lg font-bold text-atlas-energy">
              🔥 {streakDays}
            </div>
          </div>
          <div className="atlas-card-muted py-2 text-center">
            <div className="text-[10px] uppercase tracking-wider text-atlas-muted">
              Conquistas
            </div>
            <div className="text-lg font-bold">
              🏆 {achievementsUnlocked}/{achievementsTotal}
            </div>
          </div>
        </div>
      </div>

      {/* Trilha zigzag */}
      <div className="atlas-card relative overflow-hidden">
        {/* glow radial decorativo */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 8%, rgba(198,255,0,0.18), transparent 55%)",
          }}
        />

        <div className="relative py-2">
          {ordered.map((stage, i) => {
            const status = stageStatus(stage, currentStage);
            const Icon = stage.icon;
            const offset = ZIGZAG[i] ?? 0;
            const isLast = i === ordered.length - 1; // Iniciante
            const labelOnLeft = offset > 0;

            return (
              <div
                key={stage.num}
                className="relative flex justify-center items-center py-3"
              >
                {/* linha conectando pro próximo */}
                {!isLast && (
                  <div
                    className="absolute left-1/2 top-[78px] -translate-x-1/2 pointer-events-none"
                    style={{
                      width: 4,
                      height: 60,
                      background:
                        status === "locked"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(198,255,0,0.7)",
                      boxShadow:
                        status === "locked"
                          ? "none"
                          : "0 0 12px rgba(198,255,0,0.4)",
                      transform: `translate(-50%, 0) translateX(${(offset + (ZIGZAG[i + 1] ?? 0)) / 2}px)`,
                      borderRadius: 999,
                      maskImage:
                        "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
                    }}
                  />
                )}

                <div
                  className="relative flex items-center gap-3"
                  style={{ transform: `translateX(${offset}px)` }}
                >
                  {/* Label do lado oposto ao deslocamento */}
                  {labelOnLeft && (
                    <StageLabel stage={stage} status={status} progressPct={progressPct} />
                  )}

                  {/* Nó circular */}
                  <div className="relative">
                    {status === "current" && (
                      <span className="absolute inset-0 rounded-full bg-atlas-energy/30 animate-ping" />
                    )}
                    <div
                      className={
                        "relative w-[80px] h-[80px] rounded-full flex items-center justify-center transition shrink-0 " +
                        (status === "completed"
                          ? "bg-atlas-energy text-black shadow-glow"
                          : status === "current"
                            ? "bg-atlas-energy/15 border-2 border-atlas-energy text-atlas-energy shadow-glow"
                            : "bg-atlas-balance border border-white/10 text-atlas-muted")
                      }
                    >
                      {status === "locked" ? (
                        <Lock size={26} />
                      ) : (
                        <Icon size={34} />
                      )}
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-atlas-focus border border-white/10 rounded-full px-1.5 py-0.5">
                        {String(stage.num).padStart(2, "0")}
                      </span>
                      {status === "completed" && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-atlas-focus border-2 border-atlas-energy flex items-center justify-center">
                          <Check size={12} className="text-atlas-energy" />
                        </span>
                      )}
                    </div>
                  </div>

                  {!labelOnLeft && (
                    <StageLabel stage={stage} status={status} progressPct={progressPct} />
                  )}
                </div>
              </div>
            );
          })}

          {/* base "começe aqui" */}
          <div className="relative z-10 flex items-center justify-center mt-6">
            <div className="atlas-chip-energy">▸ COMECE AQUI ◂</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StageLabel({
  stage,
  status,
  progressPct,
}: {
  stage: StageDef;
  status: "completed" | "current" | "locked";
  progressPct: number;
}) {
  return (
    <div
      className={
        "rounded-2xl px-3 py-2 border text-xs whitespace-nowrap " +
        (status === "current"
          ? "bg-atlas-energy/10 border-atlas-energy/40 text-atlas-energy font-semibold"
          : status === "completed"
            ? "bg-atlas-balance/60 border-white/10 text-atlas-contrast"
            : "bg-atlas-balance/30 border-white/5 text-atlas-muted")
      }
    >
      <div className="font-bold tracking-wider">{stage.title}</div>
      <div className="text-[10px]">
        {status === "completed" && "Concluído ✓"}
        {status === "current" && `Atual · ${progressPct}%`}
        {status === "locked" && `Req. Nv. ${stage.num}`}
      </div>
    </div>
  );
}
