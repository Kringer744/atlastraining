"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { COOKIE_NAME, COOKIE_MAX_AGE, signSession } from "@/lib/auth/session";
import { findOne, insert } from "@/lib/nocodb/client";
import type { UserRole } from "@/lib/types";
import { checkRate, nocoSafe } from "@/lib/security";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string | null;
};


export type AuthState = { error?: string } | undefined;

function explain(e: unknown): string {
  if (e instanceof Error) {
    if (e.message.includes("NocoDB 429")) {
      return "Servidor sobrecarregado, tenta de novo em 5s.";
    }
    if (e.message.includes("NocoDB")) {
      return "Erro ao acessar banco. Tenta de novo.";
    }
    return e.message;
  }
  return "Erro inesperado.";
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email e senha são obrigatórios." };

  // Rate limit: 5 tentativas por minuto por email
  const rate = checkRate(`signin:${email}`, 5, 60_000);
  if (!rate.ok) {
    return { error: `Muitas tentativas. Tenta em ${rate.retryIn}s.` };
  }

  let user: UserRow | null = null;
  try {
    user = await findOne<UserRow>("users", {
      where: `(email,eq,${nocoSafe(email)})`,
    });
  } catch (e) {
    return { error: explain(e) };
  }
  if (!user) return { error: "Credenciais inválidas." };

  try {
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return { error: "Credenciais inválidas." };
  } catch {
    return { error: "Credenciais inválidas." };
  }

  try {
    const token = await signSession({
      sub: user.id,
      role: user.role,
      name: user.full_name ?? undefined,
    });
    (await cookies()).set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  } catch (e) {
    return { error: explain(e) };
  }
  redirect("/app");
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = (String(formData.get("role") ?? "client") as UserRole);

  if (!email || !password || password.length < 6)
    return { error: "Email e senha (mín. 6) obrigatórios." };
  if (!["personal", "client", "solo"].includes(role))
    return { error: "Role inválida." };

  // Rate limit: 3 signups por hora por email (anti-flood)
  const rate = checkRate(`signup:${email}`, 3, 60 * 60_000);
  if (!rate.ok) return { error: `Muitas tentativas. Tenta em ${rate.retryIn}s.` };

  try {
    const existing = await findOne<UserRow>("users", {
      where: `(email,eq,${nocoSafe(email)})`,
    });
    if (existing) return { error: "Já existe conta com este email." };
  } catch (e) {
    return { error: explain(e) };
  }

  const id = randomUUID();
  let password_hash: string;
  try {
    password_hash = await bcrypt.hash(password, 10);
  } catch (e) {
    return { error: explain(e) };
  }

  try {
    await insert("users", {
      id,
      email,
      password_hash,
      role,
      full_name: fullName || email.split("@")[0],
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    return { error: explain(e) };
  }

  if (role === "client" || role === "solo") {
    try {
      await insert("client_stats", {
        client_id: id,
        xp: 0,
        level: 1,
        streak_days: 0,
        longest_streak: 0,
        total_sessions: 0,
      });
    } catch {
      // não bloqueia signup — stats será criado on-demand depois
    }
  }

  try {
    const token = await signSession({ sub: id, role, name: fullName || undefined });
    (await cookies()).set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  } catch (e) {
    return { error: explain(e) };
  }
  redirect("/app");
}

export async function signOutAction() {
  (await cookies()).delete(COOKIE_NAME);
  redirect("/login");
}
