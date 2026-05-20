"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { update } from "@/lib/nocodb/client";

export async function markRead(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await update("reminders", { id, read_at: new Date().toISOString() });
  revalidatePath("/cliente/avisos");
}
