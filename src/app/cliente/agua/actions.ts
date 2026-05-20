"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth/server";
import { insert, list, remove, update } from "@/lib/nocodb/client";

export async function addWater(amountMl: number): Promise<void> {
  const session = await requireUser();
  await insert("water_logs", {
    id: randomUUID(),
    client_id: session.sub,
    logged_at: new Date().toISOString(),
    amount_ml: amountMl,
  });
  revalidatePath("/cliente/agua");
  revalidatePath("/eu/agua");
  revalidatePath("/cliente");
  revalidatePath("/eu");
}

export async function undoLastWater(): Promise<void> {
  const session = await requireUser();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { list: logs } = await list<{ id: string }>("water_logs", {
    where: `(client_id,eq,${session.sub})~and(logged_at,gte,${todayStart.toISOString()})`,
    sort: "-logged_at",
    fields: "id",
    limit: 1,
  });
  if (logs[0]) await remove("water_logs", logs[0].id);
  revalidatePath("/cliente/agua");
  revalidatePath("/eu/agua");
}

export async function setWaterGoal(formData: FormData): Promise<void> {
  const session = await requireUser();
  const goalMl = Number(formData.get("goal_ml") ?? 0);
  if (!goalMl || goalMl < 500 || goalMl > 10000) return;
  await update("users", { id: session.sub, daily_water_goal_ml: goalMl });
  revalidatePath("/cliente/agua");
  revalidatePath("/eu/agua");
}
