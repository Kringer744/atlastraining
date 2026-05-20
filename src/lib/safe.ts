// Helpers pra resiliência em queries de página:
// — tentaSafe: roda uma async fn, retorna default em qualquer erro
// — logSilencioso: log opcional pro server console

export async function safe<T>(
  fn: () => Promise<T>,
  fallback: T,
  ctx?: string,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (ctx) {
      // server console only — não vaza pro client
      console.error(`[safe:${ctx}]`, (e as Error)?.message ?? e);
    }
    return fallback;
  }
}

export const emptyList = { list: [] as any[], pageInfo: { totalRows: 0 } };
