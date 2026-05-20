import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { findById, list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { ClienteNav } from "@/components/app/ClienteNav";
import { ChevronLeft, Play, FileText } from "lucide-react";
import { BodyMuscles, muscleLabels } from "@/components/brand/BodyMuscles";

export default async function ClienteTreinoDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const w = await findById<{
    id: string;
    name: string;
    description: string | null;
    pdf_url: string | null;
    source: string;
    muscle_groups: string | null;
  }>("workouts", id);
  if (!w) notFound();
  const rawMuscles = typeof w.muscle_groups === "string" ? w.muscle_groups : "";
  const muscles = rawMuscles.split(",").map((s) => s.trim()).filter(Boolean);

  const { list: exs } = await list<{
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
    <AppShell bottomNav={<ClienteNav />}>
      <Link
        href="/cliente/treinos"
        className="inline-flex items-center text-atlas-muted text-sm mb-3"
      >
        <ChevronLeft size={16} /> Treinos
      </Link>

      <div className="atlas-card">
        <h1 className="text-2xl font-bold">{w.name}</h1>
        <p className="text-sm text-atlas-muted mt-1">{w.description}</p>
        <div className="mt-3 flex gap-2">
          <Link href={`/cliente/treinos/${id}/iniciar`} className="atlas-btn-primary">
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
            Você vai trabalhar · {muscleLabels(muscles)}
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
