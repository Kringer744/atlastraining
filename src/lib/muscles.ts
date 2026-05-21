// Catálogo de grupos musculares + helper de labels.
// Mantido em /lib (não em /components) pra poder ser usado em server components
// também — não tem "use client".

export const MUSCLE_GROUPS = [
  { key: "peito", label: "Peito", side: "front" as const },
  { key: "ombros", label: "Ombros", side: "both" as const },
  { key: "biceps", label: "Bíceps", side: "front" as const },
  { key: "antebraco", label: "Antebraço", side: "both" as const },
  { key: "abdomen", label: "Abdômen", side: "front" as const },
  { key: "quadriceps", label: "Quadríceps", side: "front" as const },
  { key: "panturrilha", label: "Panturrilha", side: "both" as const },
  { key: "costas", label: "Costas", side: "back" as const },
  { key: "trapezio", label: "Trapézio", side: "back" as const },
  { key: "triceps", label: "Tríceps", side: "back" as const },
  { key: "lombar", label: "Lombar", side: "back" as const },
  { key: "gluteos", label: "Glúteos", side: "back" as const },
  { key: "posterior", label: "Posterior", side: "back" as const },
] as const;

export type MuscleKey = (typeof MUSCLE_GROUPS)[number]["key"];

const DICT: Record<string, string> = Object.fromEntries(
  MUSCLE_GROUPS.map((m) => [m.key, m.label]),
);

export function muscleLabels(keys: string[]): string {
  return keys.map((k) => DICT[k] ?? k).join(", ");
}
