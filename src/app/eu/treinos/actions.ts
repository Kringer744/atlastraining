"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth/server";
import {
  findOne,
  insert,
  insertMany,
  remove,
  upsertByField,
} from "@/lib/nocodb/client";
import { uploadFile } from "@/lib/storage";

type ExerciseInput = {
  name: string;
  sets?: number | null;
  reps?: string | null;
  load_kg?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
};

export async function createOwnWorkout(payload: {
  name: string;
  description?: string | null;
  weekday?: number | null;
  exercises: ExerciseInput[];
}) {
  const session = await requireUser();
  if (session.role !== "solo") return { error: "Apenas Atlas Pessoal." };

  const id = randomUUID();
  await insert("workouts", {
    id,
    coach_id: session.sub,
    client_id: session.sub, // solo é seu próprio aluno
    name: payload.name,
    description: payload.description ?? null,
    weekday: payload.weekday ?? null,
    source: "manual",
    pdf_url: null,
    created_at: new Date().toISOString(),
  });

  const rows = payload.exercises
    .filter((e) => e.name.trim())
    .map((e, i) => ({
      id: randomUUID(),
      workout_id: id,
      position: i,
      name: e.name,
      sets: e.sets ?? null,
      reps: e.reps ?? null,
      load_kg: e.load_kg ?? null,
      rest_seconds: e.rest_seconds ?? null,
      notes: e.notes ?? null,
    }));
  if (rows.length > 0) await insertMany("workout_exercises", rows);

  revalidatePath("/eu/treinos");
  redirect(`/eu/treinos/${id}`);
}

export async function uploadOwnPdf(formData: FormData) {
  const session = await requireUser();
  if (session.role !== "solo") return { error: "Apenas Atlas Pessoal." };

  const file = formData.get("pdf") as File | null;
  const name = String(formData.get("name") ?? "").trim();
  if (!file || !name) return { error: "Nome e arquivo obrigatórios." };

  const { url } = await uploadFile({
    file,
    prefix: `workouts/${session.sub}`,
  });

  const id = randomUUID();
  await insert("workouts", {
    id,
    coach_id: session.sub,
    client_id: session.sub,
    name,
    description: null,
    weekday: null,
    source: "pdf",
    pdf_url: url,
    created_at: new Date().toISOString(),
  });

  revalidatePath("/eu/treinos");
  redirect(`/eu/treinos/${id}`);
}

export async function deleteOwnWorkout(formData: FormData) {
  const session = await requireUser();
  if (session.role !== "solo") return;
  const id = String(formData.get("id") ?? "");
  if (id) await remove("workouts", id);
  revalidatePath("/eu/treinos");
  redirect("/eu/treinos");
}

type SetInput = {
  exercise_id: string | null;
  exercise_name: string;
  set_index: number;
  reps: number | null;
  load_kg: number | null;
  rpe: number | null;
};

export async function finishOwnSession(params: {
  workout_id: string;
  perceived_effort: number;
  notes?: string | null;
  sets: SetInput[];
}) {
  const session = await requireUser();
  if (session.role !== "solo") return { error: "Apenas Atlas Pessoal." };

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

  const today = new Date().toISOString().slice(0, 10);
  const prev = (await findOne<{
    xp: number;
    streak_days: number;
    longest_streak: number;
    last_session_date: string | null;
    total_sessions: number;
  }>("client_stats", {
    where: `(client_id,eq,${session.sub})`,
  })) ?? {
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

  revalidatePath("/eu");
  redirect(`/eu/treinos/${params.workout_id}/concluido?xp=${xpEarned}&streak=${streak}`);
}

export async function addOwnMeasurement(formData: FormData): Promise<void> {
  const session = await requireUser();
  if (session.role !== "solo") return;

  const num = (k: string) => {
    const v = formData.get(k);
    return v ? Number(v) : null;
  };

  await insert("measurements", {
    id: randomUUID(),
    client_id: session.sub,
    measured_at: new Date().toISOString().slice(0, 10),
    weight_kg: num("weight_kg"),
    body_fat_pct: num("body_fat_pct"),
    waist_cm: num("waist_cm"),
    chest_cm: num("chest_cm"),
    arm_cm: num("arm_cm"),
    thigh_cm: num("thigh_cm"),
    note: String(formData.get("note") ?? "") || null,
  });

  revalidatePath("/eu/evolucao");
}
