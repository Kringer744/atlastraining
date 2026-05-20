"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { list, update } from "@/lib/nocodb/client";

export async function markRead(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await update("reminders", { id, read_at: new Date().toISOString() });
  revalidatePath("/cliente/avisos");
  revalidatePath("/cliente");
}

export async function markAllRead(): Promise<void> {
  const session = await requireUser();
  const { list: unread } = await list<{ id: string }>("reminders", {
    where: `(client_id,eq,${session.sub})~and(read_at,is,null)`,
    fields: "id",
    limit: 100,
  });
  const now = new Date().toISOString();
  for (const r of unread) {
    await update("reminders", { id: r.id, read_at: now });
  }
  revalidatePath("/cliente/avisos");
  revalidatePath("/cliente");
}
