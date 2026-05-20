import { TABLE_IDS } from "./tables";

const BASE_URL = process.env.NOCODB_BASE_URL ?? "https://app.nocodb.com";
const PAT = process.env.NOCODB_PAT ?? "";

if (!PAT && typeof window === "undefined" && process.env.NODE_ENV !== "production") {
  console.warn("[nocodb] NOCODB_PAT não definido — chamadas vão falhar");
}

type Json = Record<string, any>;

export type NocoListParams = {
  where?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  fields?: string;
};

export type TableName = keyof typeof TABLE_IDS;

// NocoDB sempre cria uma PK interna chamada "Id" (ou "ncRecordId" dependendo da versão).
// O nosso `id` (UUID) é só uma coluna texto que controlamos. Por isso, find/update/remove
// trabalham sempre via `where (id,eq,...)` e o NocoDB-Id é resolvido sob demanda.
const NC_PK_FIELD = "Id";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function nocoFetch<T = any>(
  path: string,
  init: RequestInit & { query?: Record<string, string | number | undefined> } = {},
  attempt = 0,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "xc-token": PAT,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  // NocoDB cloud limita req/s — backoff exponencial até 5 tentativas
  if (res.status === 429 && attempt < 5) {
    await sleep(300 * Math.pow(2, attempt) + Math.random() * 200);
    return nocoFetch<T>(path, init, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`NocoDB ${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function tableId(name: TableName): string {
  const id = TABLE_IDS[name];
  if (!id) {
    throw new Error(
      `Tabela '${name}' não está em tables.json. Rode 'npm run bootstrap:nocodb'.`,
    );
  }
  return id;
}

export async function list<T = Json>(
  table: TableName,
  params: NocoListParams = {},
): Promise<{ list: T[]; pageInfo: { totalRows: number } }> {
  return nocoFetch(`/api/v2/tables/${tableId(table)}/records`, {
    query: {
      where: params.where,
      sort: params.sort,
      limit: params.limit ?? 100,
      offset: params.offset,
      fields: params.fields,
    },
  });
}

export async function findOne<T = Json>(
  table: TableName,
  params: NocoListParams = {},
): Promise<T | null> {
  const { list: rows } = await list<T>(table, { ...params, limit: 1 });
  return rows[0] ?? null;
}

// Busca pelo NOSSO `id` (UUID). NocoDB-PK interna é resolvida automaticamente.
export async function findById<T = Json>(
  table: TableName,
  id: string,
  fields?: string,
): Promise<T | null> {
  return findOne<T>(table, {
    where: `(id,eq,${id})`,
    fields,
  });
}

async function resolveNcId(table: TableName, ourId: string): Promise<string | number | null> {
  const row = await findOne<Json>(table, {
    where: `(id,eq,${ourId})`,
    fields: NC_PK_FIELD,
  });
  return (row?.[NC_PK_FIELD] as string | number | null) ?? null;
}

// Para tabelas em que a "chave única do app" não é `id` (ex: client_stats.client_id),
// expomos uma versão genérica.
async function resolveNcIdByField(
  table: TableName,
  field: string,
  value: string,
): Promise<string | number | null> {
  const row = await findOne<Json>(table, {
    where: `(${field},eq,${value})`,
    fields: NC_PK_FIELD,
  });
  return (row?.[NC_PK_FIELD] as string | number | null) ?? null;
}

export async function count(table: TableName, where?: string): Promise<number> {
  const r = await nocoFetch<{ count: number }>(
    `/api/v2/tables/${tableId(table)}/records/count`,
    { query: { where } },
  );
  return r.count;
}

export async function insert<T = Json>(table: TableName, data: Json): Promise<T> {
  return nocoFetch(`/api/v2/tables/${tableId(table)}/records`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function insertMany<T = Json>(
  table: TableName,
  rows: Json[],
): Promise<T[]> {
  if (rows.length === 0) return [];
  return nocoFetch(`/api/v2/tables/${tableId(table)}/records`, {
    method: "POST",
    body: JSON.stringify(rows),
  });
}

// PATCH NocoDB precisa do `Id` interno. Recebemos o nosso `id` e resolvemos.
export async function update<T = Json>(
  table: TableName,
  data: Json & { id: string },
): Promise<T | null> {
  const ncId = await resolveNcId(table, data.id);
  if (ncId == null) return null;
  const { id, ...rest } = data;
  return nocoFetch(`/api/v2/tables/${tableId(table)}/records`, {
    method: "PATCH",
    body: JSON.stringify({ [NC_PK_FIELD]: ncId, ...rest }),
  });
}

// Upsert por qualquer campo único do nosso domínio (ex: client_id, email).
export async function upsertByField<T = Json>(
  table: TableName,
  uniqueField: string,
  data: Json,
): Promise<T> {
  const ncId = await resolveNcIdByField(table, uniqueField, String(data[uniqueField]));
  if (ncId != null) {
    return (await nocoFetch(`/api/v2/tables/${tableId(table)}/records`, {
      method: "PATCH",
      body: JSON.stringify({ [NC_PK_FIELD]: ncId, ...data }),
    })) as T;
  }
  return insert<T>(table, data);
}

export async function remove(
  table: TableName,
  ourIds: string | string[],
): Promise<void> {
  const ids = Array.isArray(ourIds) ? ourIds : [ourIds];
  const resolved: { [k: string]: string | number }[] = [];
  for (const our of ids) {
    const ncId = await resolveNcId(table, our);
    if (ncId != null) resolved.push({ [NC_PK_FIELD]: ncId });
  }
  if (resolved.length === 0) return;
  await nocoFetch(`/api/v2/tables/${tableId(table)}/records`, {
    method: "DELETE",
    body: JSON.stringify(resolved),
  });
}
