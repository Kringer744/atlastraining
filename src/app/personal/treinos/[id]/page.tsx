import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { deleteWorkout } from "../actions";
import { ChevronLeft, Trash2, FileText } from "lucide-react";
import { BodyMuscles } from '@/components/brand/BodyMuscles';
import { muscleLabels } from '@/lib/muscles';
import { safeList, safeFindById } from "@/lib/safe";

export default async function TreinoDetail({
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
    weekday: number | null;
    source: string;
    pdf_url: string | null;
    client_id: string | null;
    muscle_groups: string | null;
  }>("workouts", id);
  if (!w) notFound();
  const rawMuscles = typeof w.muscle_groups === "string" ? w.muscle_groups : "";
  const muscles = rawMuscles.split(",").map((s) => s.trim()).filter(Boolean);

  const [exsRes, clientUser] = await Promise.all([
    safeList<{
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
    }),
    w.client_id
      ? safeFindById<{ full_name: string | null }>("users", w.client_id)
      : Promise.resolve(null),
  ]);
  const exs = exsRes.list;

  return (
    <AppShell bottomNav={<PersonalNav />}>
      <Link
        href="/personal/treinos"
        className="inline-flex items-center text-atlas-muted text-sm mb-3"
      >
        <ChevronLeft size={16} /> Treinos
      </Link>

      <div className="atlas-card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{w.name}</h1>
            <div className="text-xs text-atlas-muted mt-1">
              {clientUser?.full_name ?? "Template"} ·{" "}
              {w.weekday !== null && w.weekday !== undefined
                ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][w.weekday]
                : "Sem dia"}
            </div>
            {w.description && <p className="mt-3 text-sm">{w.description}</p>}
          </div>
          <form action={deleteWorkout}>
            <input type="hidden" name="id" value={id} />
            <button className="atlas-btn-danger text-xs py-2">
              <Trash2 size={14} /> Excluir
            </button>
          </form>
        </div>

        {w.source === "pdf" && w.pdf_url && (
          <a
            href={w.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="atlas-btn-ghost mt-4 w-fit"
          >
            <FileText size={16} /> Abrir PDF
          </a>
        )}
      </div>

      {muscles.length > 0 && (
        <div className="atlas-card mt-4">
          <div className="text-xs uppercase tracking-wider text-atlas-muted mb-2 text-center">
            Grupos trabalhados · {muscleLabels(muscles)}
          </div>
          <div className="flex justify-center">
            <BodyMuscles selected={muscles} size={200} />
          </div>
        </div>
      )}

      {w.source !== "pdf" && (
        <div className="mt-4 space-y-2">
          {exs.length === 0 && (
            <div className="atlas-card-muted text-sm text-atlas-muted">
              Sem exercícios cadastrados.
            </div>
          )}
          {exs.map((e) => (
            <div key={e.id} className="atlas-card-muted flex items-center justify-between">
              <div>
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
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
