"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth/server";
import { insert } from "@/lib/nocodb/client";

export async function addMeasurement(formData: FormData): Promise<void> {
  const session = await requireUser();
  if (session.role !== "client") return;

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

  revalidatePath("/cliente/evolucao");
}
