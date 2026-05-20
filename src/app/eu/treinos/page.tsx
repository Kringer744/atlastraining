import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { EuNav } from "@/components/app/EuNav";
import { Plus, FileText, Play } from "lucide-react";
import { BodyMuscles, muscleLabels } from "@/components/brand/BodyMuscles";
import { parseCsv } from "@/lib/utils";

const WD_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function EuTreinos() {
  const session = await requireUser();
  const { list: workouts } = await list<{
    id: string;
    name: string;
    weekday: number | null;
    source: string;
    description: string | null;
    muscle_groups: string | null;
  }>("workouts", {
    where: `(client_id,eq,${session.sub})`,
    sort: "weekday",
    limit: 200,
  });

  const today = new Date().getDay();
  const todayWorkout = workouts.find((w) => w.weekday === today);
  const todayMuscles = parseCsv(todayWorkout?.muscle_groups);

  return (
    <AppShell
      title="Meus treinos"
      actions={
        <Link href="/eu/treinos/novo" className="atlas-btn-primary text-sm py-2">
          <Plus size={16} /> Novo
        </Link>
      }
      bottomNav={<EuNav />}
    >
      {todayWorkout && todayMuscles.length > 0 && (
        <div className="atlas-card mb-3 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 50% 30%, rgba(198,255,0,0.2), transparent 60%)",
            }}
          />
          <div className="relative flex items-center gap-4">
            <BodyMuscles selected={todayMuscles} side="front" size={140} />
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-[0.25em] text-atlas-energy">
                Hoje · {WD_FULL[today]}
              </div>
              <h2 className="text-2xl font-bold mt-1">{todayWorkout.name}</h2>
              <p className="text-xs text-atlas-muted mt-1">
                Vai treinar: {muscleLabels(todayMuscles)}
              </p>
              <Link
                href={`/eu/treinos/${todayWorkout.id}/iniciar`}
                className="atlas-btn-primary mt-3 inline-flex"
              >
                <Play size={16} /> Iniciar agora
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {workouts.length === 0 && (
          <div className="atlas-card text-center text-atlas-muted">
            Você ainda não tem treinos.
            <div className="mt-3">
              <Link href="/eu/treinos/novo" className="atlas-btn-primary">
                <Plus size={16} /> Criar primeiro treino
              </Link>
            </div>
          </div>
        )}
        {workouts.map((w) => {
          const muscles = parseCsv(w.muscle_groups);
          const isToday = w.weekday === today;
          return (
            <div
              key={w.id}
              className={
                "atlas-card flex items-center gap-3 " +
                (isToday ? "border-atlas-energy/40 bg-atlas-energy/5" : "")
              }
            >
              {muscles.length > 0 ? (
                <BodyMuscles selected={muscles} side="front" size={64} />
              ) : (
                <div className="w-16 h-[151px] rounded-2xl bg-atlas-balance/50 flex items-center justify-center text-[10px] text-atlas-muted text-center px-1">
                  sem músculo
                </div>
              )}
              <Link href={`/eu/treinos/${w.id}`} className="flex-1 min-w-0">
                <div className="font-semibold truncate">{w.name}</div>
                <div className="text-xs text-atlas-muted">
                  {w.weekday !== null && w.weekday !== undefined
                    ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][w.weekday]
                    : "Sem dia fixo"}
                </div>
                {muscles.length > 0 && (
                  <div className="text-[11px] text-atlas-muted/80 mt-0.5 truncate">
                    {muscleLabels(muscles)}
                  </div>
                )}
              </Link>
              <div className="flex flex-col gap-1.5 items-end shrink-0">
                {w.source === "pdf" && (
                  <Link href={`/eu/treinos/${w.id}`} className="atlas-chip">
                    <FileText size={12} /> PDF
                  </Link>
                )}
                <Link
                  href={`/eu/treinos/${w.id}/iniciar`}
                  className="atlas-btn-primary text-xs py-2"
                >
                  <Play size={14} /> Iniciar
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
