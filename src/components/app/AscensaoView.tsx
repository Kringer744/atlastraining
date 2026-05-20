import { Flag, Target, Dumbbell, Zap, Lock, Crown, Check } from "lucide-react";
import { AtlasLogo } from "@/components/brand/AtlasLogo";
import { levelFromXp } from "@/lib/utils";

type StageDef = {
  num: number;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** XP cumulativo necessário pra desbloquear esse stage */
  xpUnlock: number;
};

// Curva: 0, 250, 600, 1100, 1850, 3000, 4750, 7000
function cumulativeXp(level: number) {
  let total = 0;
  for (let l = 1; l < level; l++) total += 250 + (l - 1) * 150;
  return total;
}

const STAGES: StageDef[] = [
  { num: 1, title: "INICIANTE",   icon: Flag,     xpUnlock: cumulativeXp(1) },
  { num: 2, title: "DISCIPLINA",  icon: Target,   xpUnlock: cumulativeXp(2) },
  { num: 3, title: "CONSISTÊNCIA",icon: Dumbbell, xpUnlock: cumulativeXp(3) },
  { num: 4, title: "PERFORMANCE", icon: Zap,      xpUnlock: cumulativeXp(4) },
  { num: 5, title: "ELITE",       icon: Crown,    xpUnlock: cumulativeXp(5) },
  { num: 6, title: "SUPREMACIA",  icon: Crown,    xpUnlock: cumulativeXp(6) },
  { num: 7, title: "ATLAS",       icon: Crown,    xpUnlock: cumulativeXp(7) },
];

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

  // Pra barra de XP, normalizamos com o range do level atual
  const progressPct = Math.round((lvl.intoLevel / lvl.neededForNext) * 100);

  return (
    <div className="space-y-6">
      {/* Header: jornada + nível atual */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="atlas-card">
          <div className="flex items-center gap-2 text-atlas-energy text-[11px] uppercase tracking-[0.3em]">
            <AtlasLogo size={20} /> Sua jornada
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-2">
            ASCENSÃO
          </h1>
          <div className="h-px w-12 bg-atlas-energy my-3" />
          <p className="text-atlas-muted text-sm">
            Cada treino te leva mais longe. Siga o caminho. Supere limites. Chegue ao topo.
          </p>
        </div>

        <div className="atlas-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-atlas-muted">
                Nível atual
              </div>
              <div className="text-5xl font-bold text-atlas-energy leading-none mt-1">
                {String(currentStage).padStart(2, "0")}
              </div>
              <div className="text-atlas-energy font-semibold tracking-wider mt-1">
                {currentStageDef.title}
              </div>
            </div>
            <div className="rounded-2xl bg-atlas-energy/10 border border-atlas-energy/40 p-3">
              <currentStageDef.icon className="text-atlas-energy" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-wider text-atlas-muted mb-1">
              Seu progresso
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-atlas-energy rounded-full shadow-glow transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="text-xs text-atlas-muted mt-1">
              {xp.toLocaleString("pt-BR")} XP {currentStage < STAGES.length && `· ${(xp + (lvl.neededForNext - lvl.intoLevel)).toLocaleString("pt-BR")} pra subir`}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="atlas-card-muted py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-atlas-muted">
                Sequência
              </div>
              <div className="text-lg font-bold text-atlas-energy">
                🔥 {streakDays} {streakDays === 1 ? "dia" : "dias"}
              </div>
            </div>
            <div className="atlas-card-muted py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-atlas-muted">
                Conquistas
              </div>
              <div className="text-lg font-bold">
                🏆 {achievementsUnlocked}/{achievementsTotal}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trilha vertical */}
      <div className="atlas-card relative overflow-hidden">
        {/* fundo decorativo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-atlas-energy/10 to-transparent" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 0%, rgba(198,255,0,0.18), transparent 60%)",
            }}
          />
        </div>

        <div className="relative space-y-2 py-2">
          {[...STAGES].reverse().map((stage, idx) => {
            const status = stageStatus(stage, currentStage);
            const isLast = idx === STAGES.length - 1; // o "começe aqui" no fim
            const Icon = stage.icon;
            const lockedIcon = status === "locked";

            return (
              <div key={stage.num} className="relative">
                {/* trilha conectando */}
                {!isLast && (
                  <span
                    className={
                      "absolute left-[2.25rem] top-16 w-0.5 h-12 z-0 " +
                      (status === "locked"
                        ? "bg-white/10"
                        : "bg-atlas-energy shadow-[0_0_8px_rgba(198,255,0,0.5)]")
                    }
                  />
                )}

                <div className="relative z-10 flex items-center gap-3">
                  {/* Nó */}
                  <div
                    className={
                      "relative shrink-0 w-[72px] h-[72px] rounded-full flex items-center justify-center transition " +
                      (status === "completed"
                        ? "bg-atlas-energy text-black shadow-glow"
                        : status === "current"
                          ? "bg-atlas-energy/15 border-2 border-atlas-energy text-atlas-energy shadow-glow"
                          : "bg-atlas-balance border border-white/10 text-atlas-muted")
                    }
                  >
                    {lockedIcon ? (
                      <Lock size={26} />
                    ) : (
                      <Icon size={30} />
                    )}
                    {status === "completed" && (
                      <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-atlas-focus border-2 border-atlas-energy flex items-center justify-center">
                        <Check size={12} className="text-atlas-energy" />
                      </span>
                    )}
                  </div>

                  {/* Card */}
                  <div
                    className={
                      "flex-1 rounded-2xl px-4 py-3 border " +
                      (status === "current"
                        ? "bg-atlas-energy/10 border-atlas-energy/40"
                        : status === "completed"
                          ? "bg-atlas-balance/60 border-white/10"
                          : "bg-atlas-balance/30 border-white/5")
                    }
                  >
                    <div className="text-[11px] uppercase tracking-wider text-atlas-muted">
                      {String(stage.num).padStart(2, "0")}
                    </div>
                    <div
                      className={
                        "font-bold tracking-wider " +
                        (status === "locked" ? "text-atlas-muted" : "text-atlas-contrast")
                      }
                    >
                      {stage.title}
                    </div>
                    <div className="text-xs mt-0.5">
                      {status === "completed" && (
                        <span className="text-atlas-energy flex items-center gap-1">
                          <Check size={12} /> Concluído
                        </span>
                      )}
                      {status === "current" && (
                        <span className="text-atlas-energy">
                          Desbloqueado · {progressPct}%
                        </span>
                      )}
                      {status === "locked" && (
                        <span className="text-atlas-muted">
                          Requer nível {stage.num} ·{" "}
                          {stage.xpUnlock.toLocaleString("pt-BR")} XP
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Comece aqui */}
          <div className="relative z-10 flex items-center justify-center mt-4 pt-4 border-t border-white/5">
            <div className="atlas-chip-energy">▸ COMECE AQUI ◂</div>
          </div>
        </div>
      </div>
    </div>
  );
}
