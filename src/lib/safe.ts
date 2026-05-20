// Helpers de resiliência: roda uma async fn, retorna default em erro.
import {
  count,
  findById,
  findOne,
  list,
  type TableName,
  type NocoListParams,
} from "@/lib/nocodb/client";

export async function safe<T>(
  fn: () => Promise<T>,
  fallback: T,
  ctx?: string,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (ctx) console.error(`[safe:${ctx}]`, (e as Error)?.message ?? e);
    return fallback;
  }
}

export const emptyList = { list: [] as any[], pageInfo: { totalRows: 0 } };

// Wrappers tipados pros métodos do client.ts — nunca lançam.
export async function safeList<T = any>(
  table: TableName,
  params: NocoListParams = {},
  ctx?: string,
): Promise<{ list: T[]; pageInfo: { totalRows: number } }> {
  return safe(() => list<T>(table, params), emptyList as any, ctx ?? `list:${table}`);
}

export async function safeFindOne<T = any>(
  table: TableName,
  params: NocoListParams = {},
  ctx?: string,
): Promise<T | null> {
  return safe(() => findOne<T>(table, params), null, ctx ?? `findOne:${table}`);
}

export async function safeFindById<T = any>(
  table: TableName,
  id: string,
  fields?: string,
  ctx?: string,
): Promise<T | null> {
  return safe(() => findById<T>(table, id, fields), null, ctx ?? `findById:${table}`);
}

export async function safeCount(
  table: TableName,
  where?: string,
  ctx?: string,
): Promise<number> {
  return safe(() => count(table, where), 0, ctx ?? `count:${table}`);
}
