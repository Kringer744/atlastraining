import { list } from "@/lib/nocodb/client";

export type PR = {
  exerciseName: string;
  loadKg: number;
  previous: number;
};

// Detecta PRs nesta sessão vs histórico. Considera "PR" se a maior carga
// usada num exercício agora supera a maior carga registrada em sessões
// anteriores do mesmo cliente.
export async function detectPRs(params: {
  clientId: string;
  currentSetsFlat: Array<{
    exercise_name: string;
    load_kg: number | null;
    reps: number | null;
  }>;
  currentSessionId: string;
}): Promise<PR[]> {
  const { clientId, currentSetsFlat, currentSessionId } = params;

  // Maior carga por exercício neste treino
  const currentMax = new Map<string, number>();
  for (const s of currentSetsFlat) {
    const load = Number(s.load_kg ?? 0);
    if (!load || !s.exercise_name) continue;
    const prev = currentMax.get(s.exercise_name) ?? 0;
    if (load > prev) currentMax.set(s.exercise_name, load);
  }
  if (currentMax.size === 0) return [];

  // Busca sessões antigas do client
  const { list: pastSessions } = await list<{ id: string }>("sessions", {
    where: `(client_id,eq,${clientId})`,
    fields: "id",
    sort: "-started_at",
    limit: 50, // últimos 50 treinos
  });
  const pastIds = pastSessions
    .map((s) => s.id)
    .filter((id) => id !== currentSessionId);

  if (pastIds.length === 0) {
    // Sem histórico — todo set com carga é PR no sentido de "primeira vez"
    return Array.from(currentMax.entries()).map(([name, load]) => ({
      exerciseName: name,
      loadKg: load,
      previous: 0,
    }));
  }

  // Sets das sessões passadas (paginar pra não explodir)
  // NocoDB v2 limita where length. Vamos buscar em chunks de 5 IDs.
  const historicalMax = new Map<string, number>();
  for (let i = 0; i < pastIds.length; i += 5) {
    const chunk = pastIds.slice(i, i + 5);
    const where = chunk.map((id) => `(session_id,eq,${id})`).join("~or");
    const { list: sets } = await list<{
      exercise_name: string;
      load_kg: number | null;
    }>("session_sets", {
      where,
      fields: "exercise_name,load_kg",
      limit: 500,
    });
    for (const s of sets) {
      if (!s.exercise_name) continue;
      const load = Number(s.load_kg ?? 0);
      if (!load) continue;
      const prev = historicalMax.get(s.exercise_name) ?? 0;
      if (load > prev) historicalMax.set(s.exercise_name, load);
    }
  }

  const prs: PR[] = [];
  for (const [name, load] of currentMax.entries()) {
    const previous = historicalMax.get(name) ?? 0;
    if (load > previous) {
      prs.push({ exerciseName: name, loadKg: load, previous });
    }
  }
  return prs;
}
