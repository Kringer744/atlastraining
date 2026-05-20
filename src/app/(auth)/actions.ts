"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { COOKIE_NAME, COOKIE_MAX_AGE, signSession } from "@/lib/auth/session";
import { findOne, insert } from "@/lib/nocodb/client";
import type { UserRole } from "@/lib/types";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string | null;
};

function nocoEscape(s: string) {
  return s.replace(/[(),]/g, "\\$&");
}

export type AuthState = { error?: string } | undefined;

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email e senha são obrigatórios." };

  const user = await findOne<UserRow>("users", {
    where: `(email,eq,${nocoEscape(email)})`,
  });
  if (!user) return { error: "Credenciais inválidas." };

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return { error: "Credenciais inválidas." };

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

  const existing = await findOne<UserRow>("users", {
    where: `(email,eq,${nocoEscape(email)})`,
  });
  if (existing) return { error: "Já existe conta com este email." };

  const id = randomUUID();
  const password_hash = await bcrypt.hash(password, 10);

  await insert("users", {
    id,
    email,
    password_hash,
    role,
    full_name: fullName || email.split("@")[0],
    created_at: new Date().toISOString(),
  });

  if (role === "client" || role === "solo") {
    await insert("client_stats", {
      client_id: id,
      xp: 0,
      level: 1,
      streak_days: 0,
      longest_streak: 0,
      total_sessions: 0,
    });
  }

  const token = await signSession({ sub: id, role, name: fullName || undefined });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  redirect("/app");
}

export async function signOutAction() {
  (await cookies()).delete(COOKIE_NAME);
  redirect("/login");
}
