// Adiciona tables water_logs e sleep_sessions + coluna daily_water_goal_ml em users.
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
if (!BASE_ID || !PAT) {
  console.error("❌ Faltam NOCODB_BASE_ID/NOCODB_PAT");
  process.exit(1);
}

const tablesPath = resolve(root, "src/lib/nocodb/tables.json");
const TABLE_IDS = JSON.parse(readFileSync(tablesPath, "utf8"));

async function api(path, init = {}) {
  const r = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "xc-token": PAT, ...(init.headers ?? {}) },
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${t}`);
  return t ? JSON.parse(t) : null;
}

const TABLES = {
  water_logs: [
    { title: "id", uidt: "SingleLineText", pv: true },
    { title: "client_id", uidt: "SingleLineText" },
    { title: "logged_at", uidt: "DateTime" },
    { title: "amount_ml", uidt: "Number" },
  ],
  sleep_sessions: [
    { title: "id", uidt: "SingleLineText", pv: true },
    { title: "client_id", uidt: "SingleLineText" },
    { title: "started_at", uidt: "DateTime" },
    { title: "ended_at", uidt: "DateTime" },
    { title: "duration_min", uidt: "Number" },
    { title: "quiet_min", uidt: "Number" },
    { title: "noise_events", uidt: "Number" },
    { title: "peak_db", uidt: "Decimal" },
    { title: "quality_score", uidt: "Number" },
    { title: "note", uidt: "LongText" },
  ],
};

const existing = await api(`/api/v2/meta/bases/${BASE_ID}/tables`);
const existingMap = new Map();
for (const t of existing.list ?? []) existingMap.set(t.title, t.id);

for (const [name, columns] of Object.entries(TABLES)) {
  if (existingMap.has(name)) {
    console.log(`= ${name} já existe (${existingMap.get(name)})`);
    TABLE_IDS[name] = existingMap.get(name);
    continue;
  }
  console.log(`+ criando: ${name}`);
  const created = await api(`/api/v2/meta/bases/${BASE_ID}/tables`, {
    method: "POST",
    body: JSON.stringify({ title: name, columns }),
  });
  TABLE_IDS[name] = created.id;
}

// Adiciona daily_water_goal_ml na tabela users se ainda não existir
const usersMeta = await api(`/api/v2/meta/tables/${TABLE_IDS.users}`);
if (!usersMeta.columns.find((c) => c.title === "daily_water_goal_ml")) {
  console.log("+ users.daily_water_goal_ml");
  await api(`/api/v2/meta/tables/${TABLE_IDS.users}/columns`, {
    method: "POST",
    body: JSON.stringify({ title: "daily_water_goal_ml", uidt: "Number" }),
  });
} else {
  console.log("= users.daily_water_goal_ml já existe");
}

writeFileSync(tablesPath, JSON.stringify(TABLE_IDS, null, 2));
console.log(`✔ tables.json atualizado (${Object.keys(TABLE_IDS).length} tabelas)`);
