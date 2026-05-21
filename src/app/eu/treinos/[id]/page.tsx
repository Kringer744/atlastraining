import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { EuNav } from "@/components/app/EuNav";
import { deleteOwnWorkout } from "../actions";
import { ChevronLeft, Play, FileText, Trash2 } from "lucide-react";
import { BodyMuscles } from '@/components/brand/BodyMuscles';
import { muscleLabels } from '@/lib/muscles';
import { safeList, safeFindById } from "@/lib/safe";

export default async function EuTreinoDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const w = await safeFindById<{
    id: string;
    name: string;
    description: string | null;
    pdf_url: string | null;
    source: string;
    weekday: number | null;
    muscle_groups: string | null;
  }>("workouts", id);
  if (!w) notFound();
  const rawMuscles = typeof w.muscle_groups === "string" ? w.muscle_groups : "";
  const muscles = rawMuscles.split(",").map((s) => s.trim()).filter(Boolean);

  const { list: exs } = await safeList<{
    id: string;
    name: string;
    sets: number | null;
    reps: string | null;
    load_kg: number | null;
    rest_seconds: number | null;
  }>("workout_exercises", {
    where: `(workout_id,eq,${id})`,
    sort: "position",
    limit: 200,
  });

  return (
    <AppShell bottomNav={<EuNav />}>
      <Link
        href="/eu/treinos"
        className="inline-flex items-center text-atlas-muted text-sm mb-3"
      >
        <ChevronLeft size={16} /> Treinos
      </Link>

      <div className="atlas-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{w.name}</h1>
            <div className="text-xs text-atlas-muted mt-1">
              {w.weekday !== null && w.weekday !== undefined
                ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][w.weekday]
                : "Sem dia"}
            </div>
            {w.description && <p className="mt-3 text-sm">{w.description}</p>}
          </div>
          <form action={deleteOwnWorkout}>
            <input type="hidden" name="id" value={id} />
            <button className="atlas-btn-danger text-xs py-2">
              <Trash2 size={14} /> Excluir
            </button>
          </form>
        </div>

        <div className="mt-3 flex gap-2">
          <Link href={`/eu/treinos/${id}/iniciar`} className="atlas-btn-primary">
            <Play size={16} /> Iniciar treino
          </Link>
          {w.pdf_url && (
            <a href={w.pdf_url} target="_blank" rel="noreferrer" className="atlas-btn-ghost">
              <FileText size={16} /> Abrir PDF
            </a>
          )}
        </div>
      </div>

      {muscles.length > 0 && (
        <div className="atlas-card mt-4">
          <div className="text-xs uppercase tracking-wider text-atlas-muted mb-2 text-center">
            Grupos trabalhados · {muscleLabels(muscles)}
          </div>
          <div className="flex justify-center">
            <BodyMuscles selected={muscles} size={220} />
          </div>
        </div>
      )}

      {w.source !== "pdf" && (
        <div className="mt-4 space-y-2">
          {exs.map((e) => (
            <div key={e.id} className="atlas-card-muted">
              <div className="font-medium">{e.name}</div>
              <div className="text-xs text-atlas-muted">
                {[
                  e.sets ? `${e.sets} séries` : null,
                  e.reps ? `${e.reps} reps` : null,
                  e.load_kg ? `${e.load_kg} kg` : null,
                  e.rest_seconds ? `${e.rest_seconds}s desc.` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
