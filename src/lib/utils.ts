import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateBR(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function relativeTimePt(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d atrás`;
  return formatDateBR(date);
}

// Constrói pedaço de where pra DateTime: `(field,op,exactDate,YYYY-MM-DD HH:mm:ss)`
// NocoDB v2 exige o qualifier `exactDate` em filtros de coluna DateTime/Date.
export function nocoDateFilter(
  field: string,
  op: "gt" | "gte" | "lt" | "lte" | "eq",
  d: Date | string,
): string {
  return `(${field},${op},exactDate,${nocoDateTime(d)})`;
}

export function nocoDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const M = pad(date.getMonth() + 1);
  const D = pad(date.getDate());
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${M}-${D} ${h}:${m}:${s}`;
}

export function levelFromXp(xp: number) {
  // Simple curve: cada nivel exige 250 + (n-1)*150 XP
  let level = 1;
  let needed = 250;
  let remaining = xp;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = 250 + (level - 1) * 150;
  }
  return { level, intoLevel: remaining, neededForNext: needed };
}
