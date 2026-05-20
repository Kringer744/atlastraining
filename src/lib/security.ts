// Sanitiza valores que vão entrar no where clause do NocoDB.
// O DSL usa `( , ) ~` como delimitadores — escapamos pra string segura.
export function nocoSafe(v: string | number | null | undefined): string {
  if (v == null) return "";
  return String(v).replace(/[(),~]/g, "");
}

// UUID estrito — usado pra validar IDs vindos de URL params
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

// In-memory rate limiter por chave (IP/email). Janela de 60s.
// Em produção sem stateful storage, é "best effort" no escopo do worker.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRate(
  key: string,
  limit = 10,
  windowMs = 60_000,
): { ok: boolean; retryIn: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryIn: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryIn: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true, retryIn: 0 };
}

// Cleanup oportunístico
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
}, 5 * 60_000).unref?.();
