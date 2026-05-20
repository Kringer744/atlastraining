// Adiciona coluna `muscle_groups` (LongText, lista CSV) na tabela workouts.
// Uso: npm run add-muscle-groups
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

const BASE_URL = process.env.NOCODB_BASE_URL ?? "https://app.nocodb.com";
const PAT = process.env.NOCODB_PAT;
if (!PAT) {
  console.error("❌ NOCODB_PAT obrigatório");
  process.exit(1);
}

const ids = JSON.parse(readFileSync(resolve(root, "src/lib/nocodb/tables.json"), "utf8"));
const workoutsTableId = ids.workouts;

async function api(path, init = {}) {
  const r = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "xc-token": PAT, ...(init.headers ?? {}) },
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${t}`);
  return t ? JSON.parse(t) : null;
}

const meta = await api(`/api/v2/meta/tables/${workoutsTableId}`);
if (meta.columns.find((c) => c.title === "muscle_groups")) {
  console.log("= muscle_groups já existe");
  process.exit(0);
}

await api(`/api/v2/meta/tables/${workoutsTableId}/columns`, {
  method: "POST",
  body: JSON.stringify({ title: "muscle_groups", uidt: "LongText" }),
});
console.log("✔ coluna muscle_groups criada em workouts");
