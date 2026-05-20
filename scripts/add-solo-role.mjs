// Acrescenta a opção "solo" no SingleSelect users.role do NocoDB
// Uso: npm run add-solo-role
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
const BASE_ID = process.env.NOCODB_BASE_ID;
const PAT = process.env.NOCODB_PAT;
if (!BASE_ID || !PAT) {
  console.error("❌ Faltam NOCODB_BASE_ID/NOCODB_PAT em .env.local");
  process.exit(1);
}

const tablesPath = resolve(root, "src/lib/nocodb/tables.json");
const TABLE_IDS = JSON.parse(readFileSync(tablesPath, "utf8"));
const usersTableId = TABLE_IDS.users;
if (!usersTableId) {
  console.error("❌ users table id não encontrado em tables.json");
  process.exit(1);
}

async function api(path, init = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "xc-token": PAT, ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

const tableMeta = await api(`/api/v2/meta/tables/${usersTableId}`);
const roleCol = tableMeta.columns.find((c) => c.title === "role");
if (!roleCol) {
  console.error("❌ coluna 'role' não encontrada");
  process.exit(1);
}

const currentOpts = roleCol.colOptions?.options ?? [];
if (currentOpts.some((o) => o.title === "solo")) {
  console.log("= 'solo' já existe");
  process.exit(0);
}

const newOpts = [...currentOpts, { title: "solo" }];
await api(`/api/v2/meta/columns/${roleCol.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    ...roleCol,
    colOptions: { options: newOpts },
  }),
});
console.log("✔ opção 'solo' adicionada ao users.role");
