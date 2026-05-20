"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth/server";
import { findOne, insert, remove } from "@/lib/nocodb/client";

function nocoEscape(s: string) {
  return s.replace(/[(),]/g, "\\$&");
}

export async function linkClientByEmail(formData: FormData) {
  const session = await requireUser();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const goal = String(formData.get("goal") ?? "") || null;
  if (!email) return { error: "Email obrigatório." };

  const user = await findOne<{ id: string; role: string }>("users", {
    where: `(email,eq,${nocoEscape(email)})`,
    fields: "id,role",
  });

  if (!user) {
    // cria um convite via reminders — fica registrado, vincula manualmente quando o aluno se cadastrar
    await insert("reminders", {
      id: randomUUID(),
      coach_id: session.sub,
      client_id: null,
      title: "Convite Atlas Training",
      body: `Convite para vincular ${email}. Vincule manualmente após o cadastro do aluno.`,
      created_at: new Date().toISOString(),
    });
    revalidatePath("/personal/alunos");
    return { warning: "Aluno ainda não tem conta. Convite registrado." };
  }

  // checa duplicata
  const existing = await findOne("coach_clients", {
    where: `(coach_id,eq,${session.sub})~and(client_id,eq,${user.id})`,
  });
  if (existing) {
    revalidatePath("/personal/alunos");
    redirect("/personal/alunos");
  }

  await insert("coach_clients", {
    id: randomUUID(),
    coach_id: session.sub,
    client_id: user.id,
    status: "active",
    goal,
    started_at: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
  });

  revalidatePath("/personal/alunos");
  redirect("/personal/alunos");
}

export async function unlinkClient(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await remove("coach_clients", id);
  revalidatePath("/personal/alunos");
}
