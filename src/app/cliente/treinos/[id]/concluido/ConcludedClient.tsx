"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Trophy, TrendingUp, TrendingDown, Flame, Sparkles } from "lucide-react";
import { Confetti } from "@/components/app/Confetti";
import { AtlasCoach } from "@/components/app/AtlasCoach";
import { ProgressRing } from "@/components/brand/ProgressRing";
import { atlasCoach } from "@/lib/atlas-coach";

type PR = { exerciseName: string; loadKg: number; previous: number };

export function ConcludedClient({
  sp,
  backHref,
}: {
  sp: Record<string, string | undefined>;
  backHref: string;
}) {
  const xp = Number(sp.xp ?? 0);
  const streak = Number(sp.streak ?? 0);
  const volume = Number(sp.volume ?? 0);
  const lastVolume = Number(sp.lastVolume ?? 0);
  const rpe = Number(sp.rpe ?? 5);
  const prs: PR[] = useMemo(() => {
    try {
      return sp.prs ? JSON.parse(sp.prs) : [];
    } catch {
      return [];
    }
  }, [sp.prs]);

  const isPR = prs.length > 0;
  const delta = lastVolume > 0 ? ((volume - lastVolume) / lastVolume) * 100 : 0;
  const msg = useMemo(
    () =>
      atlasCoach.postWorkout({
        perceivedEffort: rpe,
        streak,
        isPR,
      }),
    [rpe, streak, isPR],
  );

  return (
    <div className="min-h-dvh px-5 pt-8 pb-12 max-w-2xl mx-auto">
      <Confetti active={true} duration={isPR ? 5000 : 3500} count={isPR ? 200 : 100} />

      {/* Header */}
      <div className="atlas-card text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 0%, rgba(198,255,0,0.25), transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="text-6xl">{isPR ? "🚀" : "🏆"}</div>
          <h1 className="text-3xl font-bold mt-3">
            {isPR ? "NOVO PR!" : "Treino fechado!"}
          </h1>
          <p className="text-atlas-muted text-sm mt-1">
            {isPR
              ? "Você passou de você mesmo."
              : "Disciplina hoje, resultado amanhã."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="atlas-card-muted flex flex-col items-center py-4">
          <ProgressRing
            value={100}
            size={88}
            label={<span className="text-atlas-energy text-xl font-bold">+{xp}</span>}
            sublabel="XP"
          />
          <div className="mt-2 text-xs text-atlas-muted">ganho nesta sessão</div>
        </div>
        <div className="atlas-card-muted flex flex-col items-center justify-center py-4">
          <Flame className="text-atlas-energy" size={28} />
          <div className="mt-1 text-3xl font-bold">{streak}</div>
          <div className="text-xs text-atlas-muted">dias em sequência</div>
        </div>
      </div>

      {/* Comparação com último treino */}
      <div className="atlas-card mt-3">
        <div className="text-[11px] uppercase tracking-wider text-atlas-muted">
          Volume neste treino
        </div>
        <div className="text-3xl font-bold mt-1">{volume.toLocaleString("pt-BR")} kg</div>
        {lastVolume > 0 ? (
          <div
            className={
              "mt-1 inline-flex items-center gap-1 text-xs font-semibold " +
              (delta >= 0 ? "text-atlas-energy" : "text-red-300")
            }
          >
            {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}% vs último treino ({lastVolume.toLocaleString("pt-BR")} kg)
          </div>
        ) : (
          <div className="mt-1 text-xs text-atlas-muted">
            Primeiro registro desse treino — vai virar referência.
          </div>
        )}
      </div>

      {/* PRs */}
      {prs.length > 0 && (
        <div className="atlas-card mt-3 bg-atlas-energy/10 border-atlas-energy/40">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="text-atlas-energy" size={20} />
            <div className="font-bold tracking-wider">
              {prs.length} PR{prs.length > 1 ? "s" : ""} hoje
            </div>
          </div>
          <div className="space-y-1.5">
            {prs.map((pr, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">{pr.exerciseName}</span>
                <span className="text-atlas-energy font-bold">
                  {pr.loadKg}kg{" "}
                  <span className="text-atlas-muted text-xs font-normal">
                    {pr.previous > 0 ? `(antes ${pr.previous}kg)` : "(estreia)"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Atlas msg */}
      <div className="mt-3">
        <AtlasCoach message={msg} variant="energy" />
      </div>

      <Link href={backHref} className="atlas-btn-primary w-full mt-5">
        <Sparkles size={16} /> Voltar para o início
      </Link>
    </div>
  );
}
