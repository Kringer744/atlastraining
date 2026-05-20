import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "atlas-dev-secret-change-me",
);

export type SessionPayload = {
  sub: string;
  role: "personal" | "client" | "solo";
  name?: string;
};

export const COOKIE_NAME = "atlas_session";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(SECRET);
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
