// Cria as tabelas do Atlas Training no NocoDB e grava src/lib/nocodb/tables.json
//
// Modos de autenticação (em ordem de tentativa):
//  1) NOCODB_EMAIL + NOCODB_PASSWORD  -> faz signin e usa JWT (recomendado p/ criar tabelas)
//  2) NOCODB_PAT                      -> usa Personal Access Token (precisa ter perm tableCreate)
//
// Se o token não tiver permissão para criar tabelas, o script lista o que já existe
// e grava tables.json com o que conseguir mapear, falando o que falta criar manualmente.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const envFile = resolve(root, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const BASE_URL = process.env.NOCODB_BASE_URL ?? "https://app.nocodb.com";
const BASE_ID = process.env.NOCODB_BASE_ID;
const PAT = process.env.NOCODB_PAT;
const EMAIL = process.env.NOCODB_EMAIL;
const PASSWORD = process.env.NOCODB_PASSWORD;

if (!BASE_ID) {
  console.error("❌ Faltam NOCODB_BASE_ID em .env.local");
  process.exit(1);
}

let AUTH_HEADER = null;

async function api(path, init = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(AUTH_HEADER ?? {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`${res.status} ${res.statusText}: ${text}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function tryJwtLogin() {
  if (!EMAIL || !PASSWORD) return false;
  try {
    const r = await fetch(`${BASE_URL}/api/v1/auth/user/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (!r.ok) {
      console.warn("⚠ login JWT falhou:", r.status, await r.text().catch(() => ""));
      return false;
    }
    const data = await r.json();
    if (!data.token) return false;
    AUTH_HEADER = { "xc-auth": data.token };
    console.log("✔ autenticado via JWT (email/password)");
    return true;
  } catch (e) {
    console.warn("⚠ erro no login JWT:", e.message);
    return false;
  }
}

// 1) tenta JWT primeiro (cria tabelas com certeza)
const usedJwt = await tryJwtLogin();
// 2) se não, cai no PAT
if (!usedJwt) {
  if (!PAT) {
    console.error("❌ Sem credenciais. Defina NOCODB_EMAIL+NOCODB_PASSWORD ou NOCODB_PAT.");
    process.exit(1);
  }
  AUTH_HEADER = { "xc-token": PAT };
  console.log("✔ autenticado via PAT");
}

const TABLES = {
  users: [
    { title: "id", uidt: "SingleLineText", pv: true },
    { title: "email", uidt: "Email" },
    { title: "password_hash", uidt: "LongText" },
    { title: "role", uidt: "SingleSelect", colOptions: { options: [{ title: "personal" }, { title: "client" }] } },
    { title: "full_name", uidt: "SingleLineText" },
    { title: "avatar_url", uidt: "URL" },
    { title: "phone", uidt: "PhoneNumber" },
    { title: "bio", uidt: "LongText" },
    { title: "created_at", uidt: "DateTime" },
  ],
  coach_clients: [
    { title: "id", uidt: "SingleLineText", pv: true },
    { title: "coach_id", uidt: "SingleLineText" },
    { title: "client_id", uidt: "SingleLineText" },
    { title: "status", uidt: "SingleSelect", colOptions: { options: [{ title: "active" }, { title: "paused" }, { title: "ended" }] } },
    { title: "goal", uidt: "SingleLineText" },
    { title: "started_at", uidt: "Date" },
    { title: "created_at", uidt: "DateTime" },
  ],
  workouts: [
    { title: "id", uidt: "SingleLineText", pv: true },
    { title: "coach_id", uidt: "SingleLineText" },
    { title: "client_id", uidt: "SingleLineText" },
    { title: "name", uidt: "SingleLineText" },
    { title: "description", uidt: "LongText" },
    { title: "weekday", uidt: "Number" },
    { title: "source", uidt: "SingleSelect", colOptions: { options: [{ title: "manual" }, { title: "pdf" }] } },
    { title: "pdf_url", uidt: "URL" },
    { title: "created_at", uidt: "DateTime" },
  ],
  workout_exercises: [
    { title: "id", uidt: "SingleLineText", pv: true },
    { title: "workout_id", uidt: "SingleLineText" },
    { title: "position", uidt: "Number" },
    { title: "name", uidt: "SingleLineText" },
    { title: "sets", uidt: "Number" },
    { title: "reps", uidt: "SingleLineText" },
    { title: "load_kg", uidt: "Decimal" },
    { title: "rest_seconds", uidt: "Number" },
    { title: "notes", uidt: "LongText" },
  ],
  sessions: [
    { title: "id", uidt: "SingleLineText", pv: true },
    { title: "client_id", uidt: "SingleLineText" },
    { title: "workout_id", uidt: "SingleLineText" },
    { title: "started_at", uidt: "DateTime" },
    { title: "ended_at", uidt: "DateTime" },
    { title: "total_volume_kg", uidt: "Decimal" },
    { title: "perceived_effort", uidt: "Number" },
    { title: "notes", uidt: "LongText" },
  ],
  session_sets: [
    { title: "id", uidt: "SingleLineText", pv: true },
    { title: "session_id", uidt: "SingleLineText" },
    { title: "exercise_id", uidt: "SingleLineText" },
    { title: "exercise_name", uidt: "SingleLineText" },
    { title: "set_index", uidt: "Number" },
    { title: "reps", uidt: "Number" },
    { title: "load_kg", uidt: "Decimal" },
    { title: "rpe", uidt: "Number" },
  ],
  reminders: [
    { title: "id", uidt: "SingleLineText", pv: true },
    { title: "coach_id", uidt: "SingleLineText" },
    { title: "client_id", uidt: "SingleLineText" },
    { title: "title", uidt: "SingleLineText" },
    { title: "body", uidt: "LongText" },
    { title: "scheduled_for", uidt: "DateTime" },
    { title: "read_at", uidt: "DateTime" },
    { title: "created_at", uidt: "DateTime" },
  ],
  measurements: [
    { title: "id", uidt: "SingleLineText", pv: true },
    { title: "client_id", uidt: "SingleLineText" },
    { title: "measured_at", uidt: "Date" },
    { title: "weight_kg", uidt: "Decimal" },
    { title: "body_fat_pct", uidt: "Decimal" },
    { title: "waist_cm", uidt: "Decimal" },
    { title: "chest_cm", uidt: "Decimal" },
    { title: "arm_cm", uidt: "Decimal" },
    { title: "thigh_cm", uidt: "Decimal" },
    { title: "note", uidt: "LongText" },
  ],
  client_stats: [
    { title: "client_id", uidt: "SingleLineText", pv: true },
    { title: "xp", uidt: "Number" },
    { title: "level", uidt: "Number" },
    { title: "streak_days", uidt: "Number" },
    { title: "longest_streak", uidt: "Number" },
    { title: "last_session_date", uidt: "Date" },
    { title: "total_sessions", uidt: "Number" },
  ],
  achievements: [
    { title: "id", uidt: "SingleLineText", pv: true },
    { title: "client_id", uidt: "SingleLineText" },
    { title: "code", uidt: "SingleLineText" },
    { title: "title", uidt: "SingleLineText" },
    { title: "description", uidt: "LongText" },
    { title: "unlocked_at", uidt: "DateTime" },
  ],
};

const existing = await api(`/api/v2/meta/bases/${BASE_ID}/tables`);
const existingMap = new Map();
for (const t of existing.list ?? []) {
  existingMap.set(t.title, t.id);
}

const ids = {};
const missing = [];

for (const [name, columns] of Object.entries(TABLES)) {
  if (existingMap.has(name)) {
    ids[name] = existingMap.get(name);
    console.log(`= já existe: ${name} (${ids[name]})`);
    continue;
  }
  try {
    console.log(`+ criando: ${name}`);
    const created = await api(`/api/v2/meta/bases/${BASE_ID}/tables`, {
      method: "POST",
      body: JSON.stringify({ title: name, columns }),
    });
    ids[name] = created.id;
  } catch (e) {
    if (e.status === 403) {
      missing.push({ name, columns });
      console.warn(`  ✗ sem permissão (token só faz CRUD de dados)`);
    } else {
      throw e;
    }
  }
}

const outPath = resolve(root, "src/lib/nocodb/tables.json");
writeFileSync(outPath, JSON.stringify(ids, null, 2));
console.log(`\n✔ tables.json gravado em ${outPath}`);
console.log(`  ${Object.keys(ids).length}/${Object.keys(TABLES).length} tabelas mapeadas`);

if (missing.length > 0) {
  console.log(`\n⚠ Faltam ${missing.length} tabelas. Opções:`);
  console.log(`  A) Acrescente NOCODB_EMAIL e NOCODB_PASSWORD no .env.local e rode de novo`);
  console.log(`     (login direto contorna a restrição de permissão do PAT)`);
  console.log(`  B) Crie manualmente no NocoDB UI (Base "Atlas" > + New Table):\n`);
  for (const m of missing) {
    console.log(`   • ${m.name}`);
    for (const c of m.columns) {
      console.log(`       - ${c.title} (${c.uidt}${c.pv ? ", PV" : ""})`);
    }
    console.log("");
  }
  console.log(`  Depois rode 'npm run bootstrap:nocodb' de novo pra mapear os IDs.`);
  process.exit(2);
}

console.log("\n✅ Bootstrap concluído.\n");
