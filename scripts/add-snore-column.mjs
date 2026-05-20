// Adiciona snore_events em sleep_sessions
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
if (!PAT) process.exit(1);

const ids = JSON.parse(readFileSync(resolve(root, "src/lib/nocodb/tables.json"), "utf8"));
async function api(p, init = {}) {
  const r = await fetch(`${BASE_URL}${p}`, {
    ...init,
    headers: { "Content-Type": "application/json", "xc-token": PAT, ...(init.headers ?? {}) },
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${t}`);
  return t ? JSON.parse(t) : null;
}

const meta = await api(`/api/v2/meta/tables/${ids.sleep_sessions}`);
if (meta.columns.find((c) => c.title === "snore_events")) {
  console.log("= já existe");
  process.exit(0);
}
await api(`/api/v2/meta/tables/${ids.sleep_sessions}/columns`, {
  method: "POST",
  body: JSON.stringify({ title: "snore_events", uidt: "Number" }),
});
console.log("✔ snore_events criado em sleep_sessions");
