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
