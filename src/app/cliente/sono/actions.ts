"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth/server";
import { insert } from "@/lib/nocodb/client";

export type SleepSummary = {
  startedAt: string; // ISO
  endedAt: string;   // ISO
  durationMin: number;
  quietMin: number;
  noiseEvents: number;
  peakDb: number;
  qualityScore: number;
  note?: string | null;
};

export async function saveSleepSession(s: SleepSummary): Promise<void> {
  const session = await requireUser();
  await insert("sleep_sessions", {
    id: randomUUID(),
    client_id: session.sub,
    started_at: s.startedAt,
    ended_at: s.endedAt,
    duration_min: Math.round(s.durationMin),
    quiet_min: Math.round(s.quietMin),
    noise_events: s.noiseEvents,
    peak_db: s.peakDb,
    quality_score: s.qualityScore,
    note: s.note ?? null,
  });
  revalidatePath("/cliente/sono");
  revalidatePath("/eu/sono");
  revalidatePath("/cliente");
  revalidatePath("/eu");
}
