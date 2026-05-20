// Terceira passada: consertar imports e remover duplicações
import fs from "node:fs";

const pages = [
  "src/app/cliente/agua/page.tsx",
  "src/app/cliente/ascensao/page.tsx",
  "src/app/cliente/avisos/page.tsx",
  "src/app/cliente/sono/page.tsx",
  "src/app/cliente/treinos/page.tsx",
  "src/app/cliente/treinos/[id]/page.tsx",
  "src/app/cliente/treinos/[id]/iniciar/page.tsx",
  "src/app/cliente/evolucao/page.tsx",
  "src/app/cliente/conquistas/page.tsx",
  "src/app/cliente/ranking/page.tsx",
  "src/app/cliente/page.tsx",
  "src/app/eu/agua/page.tsx",
  "src/app/eu/ascensao/page.tsx",
  "src/app/eu/sono/page.tsx",
  "src/app/eu/treinos/page.tsx",
  "src/app/eu/treinos/[id]/page.tsx",
  "src/app/eu/treinos/[id]/iniciar/page.tsx",
  "src/app/eu/evolucao/page.tsx",
  "src/app/eu/conquistas/page.tsx",
  "src/app/eu/ranking/page.tsx",
  "src/app/eu/page.tsx",
  "src/app/personal/alunos/page.tsx",
  "src/app/personal/alunos/[id]/page.tsx",
  "src/app/personal/avisos/novo/page.tsx",
  "src/app/personal/avisos/page.tsx",
  "src/app/personal/relatorios/page.tsx",
  "src/app/personal/treinos/novo/page.tsx",
  "src/app/personal/treinos/page.tsx",
  "src/app/personal/treinos/[id]/page.tsx",
  "src/app/personal/ranking/page.tsx",
  "src/app/personal/page.tsx",
];

let total = 0;
for (const p of pages) {
  if (!fs.existsSync(p)) continue;
  const before = fs.readFileSync(p, "utf8");
  let src = before;

  const usesSafeList = /\bsafeList[<(]/.test(src);
  const usesSafeFindOne = /\bsafeFindOne[<(]/.test(src);
  const usesSafeFindById = /\bsafeFindById[<(]/.test(src);
  const usesSafeCount = /\bsafeCount\(/.test(src);
  const usesSafe = /\bsafe\(/.test(src);
  const usesEmptyList = /\bemptyList\b/.test(src);

  // Remove imports antigos de list/findOne/findById/count do client.ts
  src = src.replace(
    /import\s*\{([^}]+)\}\s*from\s*["']@\/lib\/nocodb\/client["'];?/g,
    (m, names) => {
      const filtered = names
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((n) => !["list", "findOne", "findById", "count"].includes(n));
      if (filtered.length === 0) return "";
      return `import { ${filtered.join(", ")} } from "@/lib/nocodb/client";`;
    },
  );

  // Garante import correto de @/lib/safe
  const needsFromSafe = [];
  if (usesSafe) needsFromSafe.push("safe");
  if (usesEmptyList) needsFromSafe.push("emptyList");
  if (usesSafeList) needsFromSafe.push("safeList");
  if (usesSafeFindOne) needsFromSafe.push("safeFindOne");
  if (usesSafeFindById) needsFromSafe.push("safeFindById");
  if (usesSafeCount) needsFromSafe.push("safeCount");

  // Remove imports duplicados existentes do @/lib/safe
  src = src.replace(
    /import\s*\{[^}]+\}\s*from\s*["']@\/lib\/safe["'];?\n?/g,
    "",
  );

  if (needsFromSafe.length > 0) {
    const newImport = `import { ${needsFromSafe.join(", ")} } from "@/lib/safe";\n`;
    // Insere após o último import existente no topo
    const m = src.match(/^(import[\s\S]*?from\s*["'][^"']+["'];?\n)+/m);
    if (m) {
      const idx = m.index + m[0].length;
      src = src.slice(0, idx) + newImport + src.slice(idx);
    } else {
      src = newImport + src;
    }
  }

  // Limpa linhas vazias duplicadas
  src = src.replace(/\n{3,}/g, "\n\n");

  if (src !== before) {
    fs.writeFileSync(p, src);
    total++;
    console.log("✔", p);
  }
}
console.log(`\n${total} arquivos modificados`);
