// Cria tabelas water_logs, sleep_sessions + colunas adicionais em users
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

const BASE_URL = process.env.NOCODB_BASE_URL;
const BASE_ID = process.env.NOCODB_BASE_ID;
const PAT = process.env.NOCODB_PAT;
if (!PAT || !BASE_ID) {
  console.error("❌ Faltam NOCODB_PAT / NOCODB_BASE_ID");
  process.exit(1);
}

async function api(path, init = {}) {
  const r = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "xc-token": PAT, ...(init.headers ?? {}) },
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${t}`);
  return t ? JSON.parse(t) : null;
}

const tablesPath = resolve(root, "src/lib/nocodb/tables.json");
const TABLE_IDS = JSON.parse(readFileSync(tablesPath, "utf8"));

const EXTRA_TABLES = {
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
    { title: "snore_events", uidt: "Number" },
    { title: "peak_db", uidt: "Decimal" },
    { title: "quality_score", uidt: "Number" },
    { title: "note", uidt: "LongText" },
  ],
};

const EXTRA_COLUMNS = {
  users: [{ title: "daily_water_goal_ml", uidt: "Number" }],
  workouts: [{ title: "muscle_groups", uidt: "LongText" }],
};

const existing = await api(`/api/v2/meta/bases/${BASE_ID}/tables`);
const existingMap = new Map();
for (const t of existing.list ?? []) existingMap.set(t.title, t.id);

for (const [name, columns] of Object.entries(EXTRA_TABLES)) {
  if (existingMap.has(name)) {
    TABLE_IDS[name] = existingMap.get(name);
    console.log(`= já existe: ${name}`);
    continue;
  }
  console.log(`+ criando: ${name}`);
  const created = await api(`/api/v2/meta/bases/${BASE_ID}/tables`, {
    method: "POST",
    body: JSON.stringify({ title: name, columns }),
  });
  TABLE_IDS[name] = created.id;
}

for (const [tableName, cols] of Object.entries(EXTRA_COLUMNS)) {
  const tableId = TABLE_IDS[tableName];
  if (!tableId) {
    console.warn(`⚠ ${tableName} não está em tables.json — pulando colunas`);
    continue;
  }
  const meta = await api(`/api/v2/meta/tables/${tableId}`);
  const existingCols = new Set(meta.columns.map((c) => c.title));
  for (const col of cols) {
    if (existingCols.has(col.title)) {
      console.log(`= ${tableName}.${col.title} já existe`);
      continue;
    }
    await api(`/api/v2/meta/tables/${tableId}/columns`, {
      method: "POST",
      body: JSON.stringify(col),
    });
    console.log(`+ ${tableName}.${col.title} criada`);
  }
}

writeFileSync(tablesPath, JSON.stringify(TABLE_IDS, null, 2));
console.log(`\n✔ tables.json atualizado (${Object.keys(TABLE_IDS).length} tabelas)\n`);
