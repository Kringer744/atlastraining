import { requireUser } from "@/lib/auth/server";
import { findById, list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { ClienteNav } from "@/components/app/ClienteNav";
import { IniciarTreinoForm } from "@/components/app/IniciarTreinoForm";
import { finishSession } from "../../actions";
import type { WorkoutExercise } from "@/lib/types";

export default async function IniciarTreino({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const [w, exsRes] = await Promise.all([
    findById<{ name: string }>("workouts", id),
    list<WorkoutExercise>("workout_exercises", {
      where: `(workout_id,eq,${id})`,
      sort: "position",
      limit: 200,
    }),
  ]);

  return (
    <AppShell
      title={w?.name ?? "Treino"}
      subtitle="Em andamento"
      bottomNav={<ClienteNav />}
    >
      <IniciarTreinoForm workoutId={id} exercises={exsRes.list} onFinish={finishSession} />
    </AppShell>
  );
}
