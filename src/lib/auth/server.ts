import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, type SessionPayload } from "./session";
import { findById } from "@/lib/nocodb/client";
import type { Profile } from "@/lib/types";

export async function getSession(): Promise<SessionPayload | null> {
  const c = await cookies();
  return verifySession(c.get(COOKIE_NAME)?.value);
}

export async function requireUser(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error("Sessão inválida");
  return s;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const s = await getSession();
  if (!s) return null;
  return await findById<Profile>("users", s.sub);
}
