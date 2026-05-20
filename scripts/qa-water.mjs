// quick repro: cria user solo + JWT, depois bate em /eu/agua local pra ver o stack
import bc from "bcryptjs";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const envFile = resolve(root, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const HOST = process.env.QA_HOST ?? "http://localhost:3009";
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);
const ids = JSON.parse(readFileSync(resolve(root, "src/lib/nocodb/tables.json"), "utf8"));

const uid = randomUUID();
const stamp = Date.now();
const hash = await bc.hash("x", 10);

await fetch(`${process.env.NOCODB_BASE_URL}/api/v2/tables/${ids.users}/records`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "xc-token": process.env.NOCODB_PAT },
  body: JSON.stringify({
    id: uid,
    email: `qa-agua-${stamp}@x.test`,
    password_hash: hash,
    role: "solo",
    full_name: "AguaQA",
    created_at: new Date().toISOString(),
  }),
});

await fetch(`${process.env.NOCODB_BASE_URL}/api/v2/tables/${ids.client_stats}/records`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "xc-token": process.env.NOCODB_PAT },
  body: JSON.stringify({
    client_id: uid, xp: 0, level: 1, streak_days: 0, longest_streak: 0, total_sessions: 0,
  }),
});

const jwt = await new SignJWT({ sub: uid, role: "solo", name: "AguaQA" })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("30d")
  .sign(SECRET);

const r = await fetch(`${HOST}/eu/agua`, {
  headers: { Cookie: `atlas_session=${jwt}` },
  redirect: "manual",
});
console.log("status:", r.status);
const t = await r.text();
console.log("snippet:", t.slice(0, 500));

// limpa
const meta = await fetch(`${process.env.NOCODB_BASE_URL}/api/v2/tables/${ids.users}/records?where=${encodeURIComponent(`(id,eq,${uid})`)}&fields=Id&limit=1`, {
  headers: { "xc-token": process.env.NOCODB_PAT },
});
const data = await meta.json();
const ncId = data.list?.[0]?.Id;
if (ncId) {
  await fetch(`${process.env.NOCODB_BASE_URL}/api/v2/tables/${ids.users}/records`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "xc-token": process.env.NOCODB_PAT },
    body: JSON.stringify([{ Id: ncId }]),
  });
}
console.log("cleanup ok");
