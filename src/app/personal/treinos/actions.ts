"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth/server";
import { insert, insertMany, remove } from "@/lib/nocodb/client";
import { uploadFile } from "@/lib/storage";

type ExerciseInput = {
  name: string;
  sets?: number | null;
  reps?: string | null;
  load_kg?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
};

export async function createWorkout(payload: {
  name: string;
  description?: string | null;
  weekday?: number | null;
  client_id?: string | null;
  muscle_groups?: string[];
  exercises: ExerciseInput[];
}): Promise<{ id?: string; error?: string }> {
  const session = await requireUser();
  if (session.role !== "personal") return { error: "Apenas personais." };

  const id = randomUUID();
  await insert("workouts", {
    id,
    coach_id: session.sub,
    client_id: payload.client_id || null,
    name: payload.name,
    description: payload.description ?? null,
    weekday: payload.weekday ?? null,
    source: "manual",
    pdf_url: null,
    muscle_groups: (payload.muscle_groups ?? []).join(","),
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

  revalidatePath("/personal/treinos");
  return { id };
}

export async function uploadWorkoutPdf(
  formData: FormData,
): Promise<{ id?: string; error?: string }> {
  const session = await requireUser();
  if (session.role !== "personal") return { error: "Apenas personais." };

  const file = formData.get("pdf") as File | null;
  const name = String(formData.get("name") ?? "").trim();
  const clientId = String(formData.get("client_id") ?? "") || null;
  if (!file || !name) return { error: "Nome e arquivo obrigatórios." };

  const { url } = await uploadFile({
    file,
    prefix: `workouts/${session.sub}`,
  });

  const id = randomUUID();
  await insert("workouts", {
    id,
    coach_id: session.sub,
    client_id: clientId,
    name,
    description: null,
    weekday: null,
    source: "pdf",
    pdf_url: url,
    created_at: new Date().toISOString(),
  });

  revalidatePath("/personal/treinos");
  return { id };
}

export async function deleteWorkout(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await remove("workouts", id);
  revalidatePath("/personal/treinos");
  redirect("/personal/treinos");
}
