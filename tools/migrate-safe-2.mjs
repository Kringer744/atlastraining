// Segunda passada: cobre casos dentro de Promise.all() onde list/findOne/findById/count
// não têm `await` imediatamente antes.
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

  // Trocar list(/<, findOne(/<, findById(/<, count( — apenas quando NÃO tem `safe` antes
  // (já migrados não devem ser tocados).
  // Usa lookbehind negativo: precede uma quebra de linha + whitespace, mas não "safe" no nome.
  src = src.replace(/(^|[^\w])list</gm, (m, before) => {
    return before === "" ? "safeList<" : `${before}safeList<`;
  });
  src = src.replace(/(^|[^\w])list\(/gm, (m, before) => {
    return `${before}safeList(`;
  });
  src = src.replace(/(^|[^\w])findOne</gm, (m, before) => `${before}safeFindOne<`);
  src = src.replace(/(^|[^\w])findOne\(/gm, (m, before) => `${before}safeFindOne(`);
  src = src.replace(/(^|[^\w])findById</gm, (m, before) => `${before}safeFindById<`);
  src = src.replace(/(^|[^\w])findById\(/gm, (m, before) => `${before}safeFindById(`);
  src = src.replace(/(^|[^\w])count\(/gm, (m, before) => `${before}safeCount(`);

  // Reverter substituições erradas em imports (linha começa com `import` ou tem `from "@/lib/`)
  src = src.replace(/from "@\/lib\/nocodb\/client";/g, (m) => m);
  // Reverter dentro de imports
  src = src.replace(/import\s*\{([^}]+)\}\s*from\s*["']@\/lib\/nocodb\/client["']/g, (m, names) => {
    const fixed = names
      .split(",")
      .map((s) => s.trim().replace(/^safe(List|FindOne|FindById|Count)$/, (mm, kind) => kind.charAt(0).toLowerCase() + kind.slice(1)))
      .filter(Boolean)
      .join(", ");
    return `import { ${fixed} } from "@/lib/nocodb/client"`;
  });
  // Reverter dentro de imports do @/lib/safe (caso tenha duplicado prefixo)
  src = src.replace(/safesafe(List|FindOne|FindById|Count)/g, "safe$1");

  if (src !== before) {
    fs.writeFileSync(p, src);
    total++;
    console.log("✔", p);
  }
}
console.log(`\n${total} arquivos modificados`);
