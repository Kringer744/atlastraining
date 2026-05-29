import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { NovoTreinoForm, type WorkoutInitial } from "../../novo/NovoTreinoForm";
import { safeList, safeFindById } from "@/lib/safe";

export default async function EditarTreinoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  if (session.role !== "personal") redirect("/");
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
  if (w.coach_id !== session.sub) redirect("/personal/treinos");
  if (w.source === "pdf") redirect(`/personal/treinos/${id}`);

  const { list: links } = await safeList<{ client_id: string }>("coach_clients", {
    where: `(coach_id,eq,${session.sub})`,
    fields: "client_id",
    limit: 200,
  });
  let clients: { id: string; full_name: string }[] = [];
  const ids = [...new Set(links.map((l) => l.client_id).filter(Boolean))];
  if (ids.length > 0) {
    const where = ids.map((cid) => `(id,eq,${cid})`).join("~or");
    const r = await safeList<{ id: string; full_name: string | null }>("users", {
      where,
      fields: "id,full_name",
    });
    clients = r.list.map((u) => ({ id: u.id, full_name: u.full_name ?? "Aluno" }));
  }

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

  const initial: WorkoutInitial = {
    id: w.id,
    name: w.name ?? "",
    description: w.description ?? "",
    weekday: w.weekday !== null && w.weekday !== undefined ? String(w.weekday) : "",
    client_id: w.client_id ?? "",
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
    <AppShell title="Editar treino" subtitle={w.name ?? ""} bottomNav={<PersonalNav />}>
      <NovoTreinoForm clients={clients} initial={initial} />
    </AppShell>
  );
}
