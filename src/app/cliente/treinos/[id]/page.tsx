import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { findById, list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { ClienteNav } from "@/components/app/ClienteNav";
import { ChevronLeft, Play, FileText } from "lucide-react";

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
  }>("workouts", id);
  if (!w) notFound();

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
