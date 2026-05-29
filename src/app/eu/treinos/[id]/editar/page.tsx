import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { EuNav } from "@/components/app/EuNav";
import {
  NovoTreinoEuForm,
  type WorkoutEuInitial,
} from "../../novo/NovoTreinoEuForm";
import { safeList, safeFindById } from "@/lib/safe";

export default async function EditarTreinoEuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  if (session.role !== "solo") redirect("/");
  const { id } = await params;

  const w = await safeFindById<{
    id: string;
    coach_id: string;
    client_id: string | null;
    name: string;
    description: string | null;
    weekday: number | null;
    source: string;
    muscle_groups: string | null;
  }>("workouts", id);
  if (!w) notFound();
  if (w.coach_id !== session.sub || w.client_id !== session.sub) redirect("/eu/treinos");
  if (w.source === "pdf") redirect(`/eu/treinos/${id}`);

  const { list: exs } = await safeList<{
    id: string;
    name: string;
    sets: number | null;
    reps: string | null;
    load_kg: number | null;
    rest_seconds: number | null;
    notes: string | null;
  }>("workout_exercises", {
    where: `(workout_id,eq,${id})`,
    sort: "position",
    limit: 500,
  });

  const rawMuscles = typeof w.muscle_groups === "string" ? w.muscle_groups : "";
  const muscles = rawMuscles.split(",").map((s) => s.trim()).filter(Boolean);

  const initial: WorkoutEuInitial = {
    id: w.id,
    name: w.name ?? "",
    description: w.description ?? "",
    weekday: w.weekday !== null && w.weekday !== undefined ? String(w.weekday) : "",
    muscle_groups: muscles,
    exercises: exs.map((e) => ({
      name: e.name ?? "",
      sets: e.sets !== null && e.sets !== undefined ? String(e.sets) : "",
      reps: e.reps ?? "",
      load_kg: e.load_kg !== null && e.load_kg !== undefined ? String(e.load_kg) : "",
      rest_seconds:
        e.rest_seconds !== null && e.rest_seconds !== undefined ? String(e.rest_seconds) : "",
      notes: e.notes ?? "",
    })),
  };

  return (
    <AppShell title="Editar treino" subtitle={w.name ?? ""} bottomNav={<EuNav />}>
      <NovoTreinoEuForm initial={initial} />
    </AppShell>
  );
}
