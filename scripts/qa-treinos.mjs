// Testa /eu/treinos e /cliente/treinos com vários cenários:
// - sem treinos
// - com treino simples
// - com treino c/ muscle_groups
// - com treino c/ muscle_groups malformado
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

const HOST = process.env.QA_HOST ?? "http://localhost:3000";
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);
const ids = JSON.parse(readFileSync(resolve(root, "src/lib/nocodb/tables.json"), "utf8"));

async function noco(method, path, body) {
  const r = await fetch(`${process.env.NOCODB_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "xc-token": process.env.NOCODB_PAT },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${t}`);
  return t ? JSON.parse(t) : null;
}

async function get(path, cookie) {
  return fetch(`${HOST}${path}`, { headers: { Cookie: cookie }, redirect: "manual" });
}

const scenarios = [
  { role: "solo", path: "/eu/treinos", muscle: "peito,triceps", name: "Push" },
  { role: "solo", path: "/eu/treinos", muscle: null, name: "Sem músculos" },
  { role: "solo", path: "/eu/treinos", muscle: "", name: "Músculos vazio" },
  { role: "solo", path: "/eu/treinos", muscle: ",,,,", name: "Vírgulas só" },
  { role: "client", path: "/cliente/treinos", muscle: "costas,biceps", name: "Pull" },
];

let pass = 0, fail = 0;
for (const sc of scenarios) {
  const uid = randomUUID();
  const stamp = Date.now() + Math.random();
  await noco("POST", `/api/v2/tables/${ids.users}/records`, {
    id: uid,
    email: `qa-${sc.role}-${stamp}@x.test`,
    password_hash: await bc.hash("x", 10),
    role: sc.role,
    full_name: `QA ${sc.role}`,
    created_at: new Date().toISOString(),
  });
  await noco("POST", `/api/v2/tables/${ids.client_stats}/records`, {
    client_id: uid, xp: 0, level: 1, streak_days: 0, longest_streak: 0, total_sessions: 0,
  });

  // Cria workout com o cenário
  const wid = randomUUID();
  await noco("POST", `/api/v2/tables/${ids.workouts}/records`, {
    id: wid,
    coach_id: uid,
    client_id: uid,
    name: sc.name,
    description: null,
    weekday: new Date().getDay(),
    source: "manual",
    pdf_url: null,
    muscle_groups: sc.muscle,
    created_at: new Date().toISOString(),
  });

  const jwt = await new SignJWT({ sub: uid, role: sc.role, name: `QA ${sc.role}` })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
  const r = await get(sc.path, `atlas_session=${jwt}`);
  if (r.status === 200) {
    console.log(`✔ ${sc.path} [${sc.name}] -> 200`);
    pass++;
  } else {
    console.log(`✗ ${sc.path} [${sc.name}] -> ${r.status}`);
    fail++;
  }

  // limpa
  const ulookup = await noco("GET", `/api/v2/tables/${ids.users}/records?where=${encodeURIComponent(`(id,eq,${uid})`)}&fields=Id&limit=1`);
  if (ulookup.list?.[0]?.Id) {
    await noco("DELETE", `/api/v2/tables/${ids.users}/records`, [{ Id: ulookup.list[0].Id }]);
  }
  const wlookup = await noco("GET", `/api/v2/tables/${ids.workouts}/records?where=${encodeURIComponent(`(id,eq,${wid})`)}&fields=Id&limit=1`);
  if (wlookup.list?.[0]?.Id) {
    await noco("DELETE", `/api/v2/tables/${ids.workouts}/records`, [{ Id: wlookup.list[0].Id }]);
  }
}
console.log(`\n${pass} passes · ${fail} falhas`);
process.exit(fail > 0 ? 1 : 0);
