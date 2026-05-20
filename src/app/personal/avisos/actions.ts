"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth/server";
import { insert } from "@/lib/nocodb/client";

export async function createReminder(formData: FormData): Promise<void> {
  const session = await requireUser();
  if (session.role !== "personal") return;

  const client_id = String(formData.get("client_id") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim() || null;
  const scheduled_for = String(formData.get("scheduled_for") ?? "") || null;
  if (!title) return;

  await insert("reminders", {
    id: randomUUID(),
    coach_id: session.sub,
    client_id,
    title,
    body,
    scheduled_for,
    created_at: new Date().toISOString(),
  });

  revalidatePath("/personal/avisos");
  redirect("/personal/avisos");
}
