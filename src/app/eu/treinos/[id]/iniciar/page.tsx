import { requireUser } from "@/lib/auth/server";
import { safeList, safeFindById } from "@/lib/safe";

import { AppShell } from "@/components/app/AppShell";
import { EuNav } from "@/components/app/EuNav";
import { IniciarTreinoForm } from "@/components/app/IniciarTreinoForm";
import { finishOwnSession } from "../../actions";
import type { WorkoutExercise } from "@/lib/types";

export default async function IniciarEu({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const [w, exsRes] = await Promise.all([
    safeFindById<{ name: string }>("workouts", id),
    safeList<WorkoutExercise>("workout_exercises", {
      where: `(workout_id,eq,${id})`,
      sort: "position",
      limit: 200,
    }),
  ]);

  return (
    <AppShell
      title={w?.name ?? "Treino"}
      subtitle="Em andamento"
      bottomNav={<EuNav />}
    >
      <IniciarTreinoForm workoutId={id} exercises={exsRes.list} onFinish={finishOwnSession} />
    </AppShell>
  );
}
