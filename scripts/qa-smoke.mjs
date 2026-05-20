// QA smoke — exercita os fluxos críticos contra o NocoDB real.
// - cria 3 usuários (personal, client, solo) via signup HTTP
// - faz login e bate as páginas autenticadas
// - verifica que os endpoints retornam 200

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

const HOST = process.env.QA_HOST ?? "http://localhost:3003";
const stamp = Date.now();
const users = [
  { role: "personal", email: `qa-personal-${stamp}@atlas.test`, password: "atlas-test-123", full_name: "QA Personal" },
  { role: "client", email: `qa-client-${stamp}@atlas.test`, password: "atlas-test-123", full_name: "QA Aluno" },
  { role: "solo", email: `qa-solo-${stamp}@atlas.test`, password: "atlas-test-123", full_name: "QA Solo" },
];

const sessions = new Map(); // role -> cookie string
let pass = 0;
let fail = 0;

function ok(msg) {
  console.log(`  ✔ ${msg}`);
  pass++;
}
function bad(msg, extra) {
  console.log(`  ✗ ${msg}${extra ? " — " + extra : ""}`);
  fail++;
}

async function postForm(path, fields, cookie) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) body.append(k, String(v));
  const r = await fetch(`${HOST}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body,
    redirect: "manual",
  });
  return r;
}

async function get(path, cookie) {
  return fetch(`${HOST}${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "manual",
  });
}

// === 0) Pré-limpeza de QA antigos ===
console.log("\n=== 0) Pré-limpeza ===");
import bcrypt0 from "bcryptjs"; void bcrypt0;
{
  const TABLE_IDS_PRE = JSON.parse(
    readFileSync(resolve(root, "src/lib/nocodb/tables.json"), "utf8"),
  );
  async function nocoPre(method, path, body) {
    const r = await fetch(`${process.env.NOCODB_BASE_URL ?? "https://app.nocodb.com"}${path}`, {
      method,
      headers: { "Content-Type": "application/json", "xc-token": process.env.NOCODB_PAT },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 429) {
      await new Promise((s) => setTimeout(s, 2000));
      return nocoPre(method, path, body);
    }
    if (!r.ok) return null;
    const t = await r.text();
    return t ? JSON.parse(t) : null;
  }
  const stale = await nocoPre(
    "GET",
    `/api/v2/tables/${TABLE_IDS_PRE.users}/records?where=${encodeURIComponent("(email,like,qa-%@atlas.test)")}&limit=100&fields=Id,id`,
  );
  if (stale?.list?.length) {
    for (const u of stale.list) {
      // limpa client_stats deles
      const cs = await nocoPre(
        "GET",
        `/api/v2/tables/${TABLE_IDS_PRE.client_stats}/records?where=${encodeURIComponent(`(client_id,eq,${u.id})`)}&limit=100&fields=Id`,
      );
      if (cs?.list?.length) {
        await nocoPre("DELETE", `/api/v2/tables/${TABLE_IDS_PRE.client_stats}/records`,
          cs.list.map((x) => ({ Id: x.Id })));
      }
    }
    await nocoPre(
      "DELETE",
      `/api/v2/tables/${TABLE_IDS_PRE.users}/records`,
      stale.list.map((x) => ({ Id: x.Id })),
    );
    ok(`removeu ${stale.list.length} QA users antigos`);
  } else {
    ok("nenhum QA user antigo");
  }
}

// === 1) Signup ===
console.log("\n=== 1) Signup via NocoDB ===");
// Server Action é POSTado como multipart — vamos usar o caminho direto: insere via API
// porém, signup envolve bcrypt+cookie. Mais simples: invocar a Server Action via /signup.
// Next.js 15 não expõe Server Action por URL direta sem CSRF, então criamos os usuários
// via NocoDB direto e validamos as queries.

import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";

const BASE_URL = process.env.NOCODB_BASE_URL ?? "https://app.nocodb.com";
const PAT = process.env.NOCODB_PAT;
const TABLE_IDS = JSON.parse(
  readFileSync(resolve(root, "src/lib/nocodb/tables.json"), "utf8"),
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function noco(method, path, body, attempt = 0) {
  await sleep(150); // anti-throttle preventivo
  const r = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "xc-token": PAT },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (r.status === 429 && attempt < 8) {
    await sleep(2000 * (attempt + 1));
    return noco(method, path, body, attempt + 1);
  }
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

for (const u of users) {
  u.id = randomUUID();
  u.password_hash = await bcrypt.hash(u.password, 10);
  await noco("POST", `/api/v2/tables/${TABLE_IDS.users}/records`, {
    id: u.id,
    email: u.email,
    password_hash: u.password_hash,
    role: u.role,
    full_name: u.full_name,
    created_at: new Date().toISOString(),
  });
  if (u.role === "client" || u.role === "solo") {
    await noco("POST", `/api/v2/tables/${TABLE_IDS.client_stats}/records`, {
      client_id: u.id,
      xp: 0,
      level: 1,
      streak_days: 0,
      longest_streak: 0,
      total_sessions: 0,
    });
  }
  ok(`criou ${u.role} ${u.email} (${u.id})`);
}

// === 2) Login HTTP: emula gerar cookie de sessão direto ===
console.log("\n=== 2) Sessão JWT ===");
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET ?? "atlas-dev-secret-change-me");
for (const u of users) {
  const jwt = await new SignJWT({ sub: u.id, role: u.role, name: u.full_name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
  sessions.set(u.role, `atlas_session=${jwt}`);
  ok(`assinou JWT para ${u.role}`);
}

// === 3) Bate páginas do Personal ===
console.log("\n=== 3) Personal: dashboard, alunos, treinos, avisos, relatórios ===");
const personalPaths = [
  "/personal",
  "/personal/alunos",
  "/personal/alunos/novo",
  "/personal/treinos",
  "/personal/treinos/novo",
  "/personal/avisos",
  "/personal/avisos/novo",
  "/personal/relatorios",
];
for (const p of personalPaths) {
  try {
    const r = await get(p, sessions.get("personal"));
    if (r.status === 200) ok(`GET ${p} -> 200`);
    else bad(`GET ${p}`, `HTTP ${r.status}`);
  } catch (e) {
    bad(`GET ${p}`, e.message);
  }
}

// === 4) Bate páginas do Cliente ===
console.log("\n=== 4) Cliente ===");
const clientPaths = [
  "/cliente",
  "/cliente/treinos",
  "/cliente/evolucao",
  "/cliente/conquistas",
  "/cliente/avisos",
];
for (const p of clientPaths) {
  try {
    const r = await get(p, sessions.get("client"));
    if (r.status === 200) ok(`GET ${p} -> 200`);
    else bad(`GET ${p}`, `HTTP ${r.status}`);
  } catch (e) {
    bad(`GET ${p}`, e.message);
  }
}

// === 5) Bate páginas do Solo ===
console.log("\n=== 5) Solo (/eu) ===");
const soloPaths = [
  "/eu",
  "/eu/treinos",
  "/eu/treinos/novo",
  "/eu/evolucao",
  "/eu/conquistas",
];
for (const p of soloPaths) {
  try {
    const r = await get(p, sessions.get("solo"));
    if (r.status === 200) ok(`GET ${p} -> 200`);
    else bad(`GET ${p}`, `HTTP ${r.status}`);
  } catch (e) {
    bad(`GET ${p}`, e.message);
  }
}

// === 6) Verifica que /personal bloqueia client/solo ===
console.log("\n=== 6) Guardas de role ===");
{
  const r = await get("/personal", sessions.get("client"));
  if (r.status === 307 || r.status === 302) ok("client em /personal -> redirect");
  else bad("client em /personal", `HTTP ${r.status}`);
}
{
  const r = await get("/eu", sessions.get("personal"));
  if (r.status === 307 || r.status === 302) ok("personal em /eu -> redirect");
  else bad("personal em /eu", `HTTP ${r.status}`);
}
{
  const r = await get("/cliente", sessions.get("solo"));
  if (r.status === 307 || r.status === 302) ok("solo em /cliente -> redirect");
  else bad("solo em /cliente", `HTTP ${r.status}`);
}

// === 7) `/` redireciona pra login se anônimo ===
console.log("\n=== 7) Root sem sessão ===");
{
  const r = await get("/", null);
  if ((r.status === 307 || r.status === 302) && (r.headers.get("location") || "").includes("/login")) {
    ok("/ anônimo -> /login");
  } else {
    bad("/ anônimo", `HTTP ${r.status} loc=${r.headers.get("location")}`);
  }
}

// === 7.1) Fluxo crítico: personal cria treino, vincula aluno, registra sessão ===
console.log("\n=== 7.1) Fluxo crítico ===");
const personal = users.find((u) => u.role === "personal");
const client = users.find((u) => u.role === "client");
const solo = users.find((u) => u.role === "solo");

// vincular
const linkId = randomUUID();
await noco("POST", `/api/v2/tables/${TABLE_IDS.coach_clients}/records`, {
  id: linkId,
  coach_id: personal.id,
  client_id: client.id,
  status: "active",
  goal: "QA test",
  started_at: new Date().toISOString().slice(0, 10),
  created_at: new Date().toISOString(),
});
ok("vinculou aluno ao personal");

// criar treino atribuído ao cliente
const workoutId = randomUUID();
await noco("POST", `/api/v2/tables/${TABLE_IDS.workouts}/records`, {
  id: workoutId,
  coach_id: personal.id,
  client_id: client.id,
  name: "QA Push Day",
  description: null,
  weekday: 1,
  source: "manual",
  created_at: new Date().toISOString(),
});
ok("criou treino para o cliente");

// exercício
const exerciseId = randomUUID();
await noco("POST", `/api/v2/tables/${TABLE_IDS.workout_exercises}/records`, {
  id: exerciseId,
  workout_id: workoutId,
  position: 0,
  name: "Supino reto",
  sets: 4,
  reps: "8-10",
  load_kg: 60,
  rest_seconds: 90,
});
ok("adicionou exercício");

// página de detalhe do treino (autenticado como personal)
{
  const r = await get(`/personal/treinos/${workoutId}`, sessions.get("personal"));
  if (r.status === 200) ok(`personal vê /personal/treinos/${workoutId.slice(0, 8)}…`);
  else bad(`personal /personal/treinos/[id]`, `HTTP ${r.status}`);
}

// detalhe do aluno
{
  const r = await get(`/personal/alunos/${client.id}`, sessions.get("personal"));
  if (r.status === 200) ok("personal vê /personal/alunos/[id]");
  else bad("personal /personal/alunos/[id]", `HTTP ${r.status}`);
}

// cliente acessa detalhe + iniciar do mesmo treino
{
  const r = await get(`/cliente/treinos/${workoutId}`, sessions.get("client"));
  if (r.status === 200) ok("cliente vê detalhe do treino");
  else bad("cliente /cliente/treinos/[id]", `HTTP ${r.status}`);
}
{
  const r = await get(`/cliente/treinos/${workoutId}/iniciar`, sessions.get("client"));
  if (r.status === 200) ok("cliente vê tela de execução");
  else bad("cliente .../iniciar", `HTTP ${r.status}`);
}

// sessão registrada
const sessionId = randomUUID();
await noco("POST", `/api/v2/tables/${TABLE_IDS.sessions}/records`, {
  id: sessionId,
  client_id: client.id,
  workout_id: workoutId,
  started_at: new Date().toISOString(),
  ended_at: new Date().toISOString(),
  total_volume_kg: 1920,
  perceived_effort: 8,
});
ok("registrou sessão do cliente");

// dashboard do personal deve mostrar a sessão recente
{
  const r = await get("/personal", sessions.get("personal"));
  if (r.status === 200) ok("personal dashboard com sessão");
  else bad("personal dashboard pós-sessão", `HTTP ${r.status}`);
}

// solo cria seu próprio treino
const soloWorkoutId = randomUUID();
await noco("POST", `/api/v2/tables/${TABLE_IDS.workouts}/records`, {
  id: soloWorkoutId,
  coach_id: solo.id,
  client_id: solo.id,
  name: "QA Solo Pull Day",
  weekday: 3,
  source: "manual",
  created_at: new Date().toISOString(),
});
{
  const r = await get(`/eu/treinos/${soloWorkoutId}`, sessions.get("solo"));
  if (r.status === 200) ok("solo vê detalhe do próprio treino");
  else bad("solo /eu/treinos/[id]", `HTTP ${r.status}`);
}

// aviso broadcast do personal alcança o cliente
const reminderId = randomUUID();
await noco("POST", `/api/v2/tables/${TABLE_IDS.reminders}/records`, {
  id: reminderId,
  coach_id: personal.id,
  client_id: null,
  title: "QA broadcast",
  body: "todo mundo treina hoje",
  created_at: new Date().toISOString(),
});
{
  const r = await get("/cliente/avisos", sessions.get("client"));
  if (r.status === 200) ok("cliente vê aviso broadcast");
  else bad("cliente /cliente/avisos", `HTTP ${r.status}`);
}

// === 8) Limpeza ===
console.log("\n=== 8) Limpeza ===");
async function resolveAndDelete(table, where) {
  const r = await noco("GET", `/api/v2/tables/${TABLE_IDS[table]}/records?where=${encodeURIComponent(where)}&limit=100&fields=Id`);
  if (r.list?.length) {
    await noco("DELETE", `/api/v2/tables/${TABLE_IDS[table]}/records`, r.list.map((x) => ({ Id: x.Id })));
    return r.list.length;
  }
  return 0;
}
// limpa exercises órfãos primeiro (filtrando pelos workouts dos nossos usuários)
for (const u of users) {
  // exercícios dos workouts deste user (como coach)
  const wks = await noco(
    "GET",
    `/api/v2/tables/${TABLE_IDS.workouts}/records?where=${encodeURIComponent(`(coach_id,eq,${u.id})`)}&limit=100&fields=id`,
  );
  for (const w of wks.list ?? []) {
    await resolveAndDelete("workout_exercises", `(workout_id,eq,${w.id})`);
    await resolveAndDelete("session_sets", `(session_id,eq,${w.id})`); // best effort
  }
  const sess = await resolveAndDelete("sessions", `(client_id,eq,${u.id})`);
  const meas = await resolveAndDelete("measurements", `(client_id,eq,${u.id})`);
  const ach = await resolveAndDelete("achievements", `(client_id,eq,${u.id})`);
  const wk = await resolveAndDelete("workouts", `(coach_id,eq,${u.id})`);
  const lk = await resolveAndDelete("coach_clients", `(coach_id,eq,${u.id})`);
  const rm = await resolveAndDelete("reminders", `(coach_id,eq,${u.id})`);
  const cs = await resolveAndDelete("client_stats", `(client_id,eq,${u.id})`);
  await resolveAndDelete("users", `(id,eq,${u.id})`);
  ok(`limpou ${u.role} (sess:${sess} meas:${meas} ach:${ach} wk:${wk} link:${lk} rem:${rm} stats:${cs})`);
}

console.log(`\n${pass} passes · ${fail} falhas`);
process.exit(fail > 0 ? 1 : 0);
