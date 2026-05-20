import fs from "node:fs";

const pages = [
  "src/app/cliente/agua/page.tsx",
  "src/app/cliente/ascensao/page.tsx",
  "src/app/cliente/avisos/page.tsx",
  "src/app/cliente/sono/page.tsx",
  "src/app/cliente/treinos/page.tsx",
  "src/app/cliente/treinos/[id]/page.tsx",
  "src/app/cliente/evolucao/page.tsx",
  "src/app/cliente/conquistas/page.tsx",
  "src/app/cliente/ranking/page.tsx",
  "src/app/eu/agua/page.tsx",
  "src/app/eu/ascensao/page.tsx",
  "src/app/eu/sono/page.tsx",
  "src/app/eu/treinos/page.tsx",
  "src/app/eu/treinos/[id]/page.tsx",
  "src/app/eu/evolucao/page.tsx",
  "src/app/eu/conquistas/page.tsx",
  "src/app/eu/ranking/page.tsx",
  "src/app/personal/alunos/page.tsx",
  "src/app/personal/alunos/[id]/page.tsx",
  "src/app/personal/avisos/novo/page.tsx",
  "src/app/personal/avisos/page.tsx",
  "src/app/personal/relatorios/page.tsx",
  "src/app/personal/treinos/novo/page.tsx",
  "src/app/personal/treinos/page.tsx",
  "src/app/personal/treinos/[id]/page.tsx",
  "src/app/personal/ranking/page.tsx",
];

let total = 0;
for (const p of pages) {
  if (!fs.existsSync(p)) {
    console.log("skip:", p);
    continue;
  }
  const before = fs.readFileSync(p, "utf8");
  let src = before;

  const usesList = /\bawait list[(<]/.test(src);
  const usesFindOne = /\bawait findOne[(<]/.test(src);
  const usesFindById = /\bawait findById[(<]/.test(src);
  const usesCount = /\bawait count\(/.test(src);

  // remove imports antigos do client.ts (preserva outros) e adiciona safe* via @/lib/safe
  src = src.replace(
    /import\s*\{([^}]+)\}\s*from\s*["']@\/lib\/nocodb\/client["'];?/,
    (m, imports) => {
      const names = imports
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const kept = names.filter(
        (n) => !["list", "findOne", "findById", "count"].includes(n),
      );
      const needed = [];
      if (usesList) needed.push("safeList");
      if (usesFindOne) needed.push("safeFindOne");
      if (usesFindById) needed.push("safeFindById");
      if (usesCount) needed.push("safeCount");
      const parts = [];
      if (kept.length > 0)
        parts.push(`import { ${kept.join(", ")} } from "@/lib/nocodb/client";`);
      if (needed.length > 0)
        parts.push(`import { ${needed.join(", ")} } from "@/lib/safe";`);
      return parts.join("\n");
    },
  );

  src = src.replace(/\bawait list</g, "await safeList<");
  src = src.replace(/\bawait list\(/g, "await safeList(");
  src = src.replace(/\bawait findOne</g, "await safeFindOne<");
  src = src.replace(/\bawait findOne\(/g, "await safeFindOne(");
  src = src.replace(/\bawait findById</g, "await safeFindById<");
  src = src.replace(/\bawait findById\(/g, "await safeFindById(");
  src = src.replace(/\bawait count\(/g, "await safeCount(");

  if (src !== before) {
    fs.writeFileSync(p, src);
    total++;
    console.log("✔", p);
  }
}
console.log(`\n${total} arquivos modificados`);
