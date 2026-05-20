"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth/server";
import {
  findOne,
  insert,
  insertMany,
  list,
  update,
  upsertByField,
} from "@/lib/nocodb/client";
import { detectPRs } from "@/lib/pr-detection";

type SetInput = {
  exercise_id: string | null;
  exercise_name: string;
  set_index: number;
  reps: number | null;
  load_kg: number | null;
  rpe: number | null;
};

export async function finishSession(params: {
  workout_id: string;
  perceived_effort: number;
  notes?: string | null;
  sets: SetInput[];
}): Promise<{ redirectTo?: string; error?: string }> {
  const session = await requireUser();
  if (session.role !== "client") return { error: "Apenas alunos." };

  const totalVolume = params.sets.reduce(
    (acc, s) => acc + Number(s.load_kg ?? 0) * Number(s.reps ?? 0),
    0,
  );

  const sessionId = randomUUID();
  const startedAt = new Date().toISOString();
  await insert("sessions", {
    id: sessionId,
    client_id: session.sub,
    workout_id: params.workout_id,
    started_at: startedAt,
    ended_at: startedAt,
    total_volume_kg: totalVolume,
    perceived_effort: params.perceived_effort,
    notes: params.notes ?? null,
  });

  if (params.sets.length > 0) {
    await insertMany(
      "session_sets",
      params.sets.map((s) => ({
        id: randomUUID(),
        session_id: sessionId,
        exercise_id: s.exercise_id,
        exercise_name: s.exercise_name,
        set_index: s.set_index,
        reps: s.reps,
        load_kg: s.load_kg,
        rpe: s.rpe,
      })),
    );
  }

  // === Gamificação ===
  const today = new Date().toISOString().slice(0, 10);
  const prev = (await findOne<{
    client_id: string;
    xp: number;
    streak_days: number;
    longest_streak: number;
    last_session_date: string | null;
    total_sessions: number;
  }>("client_stats", {
    where: `(client_id,eq,${session.sub})`,
  })) ?? {
    client_id: session.sub,
    xp: 0,
    streak_days: 0,
    longest_streak: 0,
    last_session_date: null,
    total_sessions: 0,
  };

  let streak = prev.streak_days ?? 0;
  if (prev.last_session_date) {
    const last = new Date(prev.last_session_date);
    last.setHours(0, 0, 0, 0);
    const diff = Math.round((Date.parse(today) - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) {
      // mesma data
    } else if (diff === 1) {
      streak += 1;
    } else {
      streak = 1;
    }
  } else {
    streak = 1;
  }

  const baseXp = 80;
  const bonusVolume = Math.min(60, Math.floor(totalVolume / 200));
  const bonusEffort = Math.max(0, params.perceived_effort - 5) * 6;
  const xpEarned = baseXp + bonusVolume + bonusEffort;
  const newXp = (prev.xp ?? 0) + xpEarned;
  const longest = Math.max(prev.longest_streak ?? 0, streak);
  const total = (prev.total_sessions ?? 0) + 1;

  await upsertByField("client_stats", "client_id", {
    client_id: session.sub,
    xp: newXp,
    level: 1,
    streak_days: streak,
    longest_streak: longest,
    last_session_date: today,
    total_sessions: total,
  });

  const unlocks: { code: string; title: string; description: string }[] = [];
  if (total === 1) unlocks.push({ code: "FIRST_WORKOUT", title: "Primeiro treino", description: "Você começou!" });
  if (streak === 3) unlocks.push({ code: "STREAK_3", title: "3 dias seguidos", description: "Ritmo!" });
  if (streak === 7) unlocks.push({ code: "STREAK_7", title: "1 semana", description: "Você é consistente." });
  if (streak === 30) unlocks.push({ code: "STREAK_30", title: "1 mês completo", description: "Pura disciplina." });
  if (total === 10) unlocks.push({ code: "WORKOUTS_10", title: "10 treinos", description: "A jornada começou." });
  if (total === 50) unlocks.push({ code: "WORKOUTS_50", title: "50 treinos", description: "Atleta de verdade." });
  if (totalVolume >= 5000)
    unlocks.push({ code: "VOLUME_5K", title: "5 toneladas", description: "Volume bruto neste treino." });

  for (const u of unlocks) {
    const existing = await findOne("achievements", {
      where: `(client_id,eq,${session.sub})~and(code,eq,${u.code})`,
    });
    if (!existing) {
      await insert("achievements", {
        id: randomUUID(),
        client_id: session.sub,
        code: u.code,
        title: u.title,
        description: u.description,
        unlocked_at: new Date().toISOString(),
      });
    }
  }

  // PR detection
  const prs = await detectPRs({
    clientId: session.sub,
    currentSetsFlat: params.sets.map((s) => ({
      exercise_name: s.exercise_name,
      load_kg: s.load_kg,
      reps: s.reps,
    })),
    currentSessionId: sessionId,
  });
  if (prs.length > 0) {
    unlocks.push({
      code: `PR_${Date.now()}`,
      title: `${prs.length} PR${prs.length > 1 ? "s" : ""} hoje`,
      description: prs.map((p) => `${p.exerciseName}: ${p.loadKg}kg`).join(" · "),
    });
    for (const u of unlocks.slice(-1)) {
      await insert("achievements", {
        id: randomUUID(),
        client_id: session.sub,
        code: u.code,
        title: u.title,
        description: u.description,
        unlocked_at: new Date().toISOString(),
      });
    }
  }

  // Comparação com último treino do mesmo workout
  const { list: prevSessions } = await list<{ total_volume_kg: number }>(
    "sessions",
    {
      where: `(client_id,eq,${session.sub})~and(workout_id,eq,${params.workout_id})`,
      sort: "-started_at",
      fields: "total_volume_kg",
      limit: 2,
    },
  );
  const lastVolume = Number(prevSessions[1]?.total_volume_kg ?? 0);

  revalidatePath("/cliente");

  const q = new URLSearchParams({
    xp: String(xpEarned),
    streak: String(streak),
    volume: String(Math.round(totalVolume)),
    lastVolume: String(Math.round(lastVolume)),
    rpe: String(params.perceived_effort),
    prs: prs.length > 0 ? JSON.stringify(prs) : "",
  });
  return {
    redirectTo: `/cliente/treinos/${params.workout_id}/concluido?${q.toString()}`,
  };
}
