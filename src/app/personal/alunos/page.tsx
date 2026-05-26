import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { Plus, ChevronRight, Flame } from "lucide-react";
import { safeList } from "@/lib/safe";

export default async function AlunosPage() {
  const session = await requireUser();

  const { list: links } = await safeList<{
    id: string;
    status: string;
    goal: string | null;
    started_at: string;
    client_id: string;
  }>("coach_clients", {
    where: `(coach_id,eq,${session.sub})`,
    sort: "-started_at",
    limit: 200,
  });

  let users: { id: string; full_name: string | null }[] = [];
  if (links.length > 0) {
    const where = [...new Set(links.map((l) => l.client_id))]
      .map((id) => `(id,eq,${id})`)
      .join("~or");
    const r = await safeList<{ id: string; full_name: string | null }>("users", {
      where,
      fields: "id,full_name",
    });
    users = r.list;
  }
  const userById: Record<string, string> = {};
  for (const u of users) userById[u.id] = u.full_name ?? "Aluno";

  return (
    <AppShell
      title="Alunos"
      subtitle={`${links.length} no total`}
      actions={
        <Link href="/personal/alunos/novo" className="atlas-btn-primary text-sm py-2">
          <Plus size={16} /> Novo
        </Link>
      }
      bottomNav={<PersonalNav />}
    >
      <div className="space-y-2 atlas-stagger">
        {links.length === 0 && (
          <div className="atlas-card text-center text-atlas-muted">
            Você ainda não tem alunos vinculados.
            <div className="mt-3">
              <Link href="/personal/alunos/novo" className="atlas-btn-primary">
                <Plus size={16} /> Adicionar aluno
              </Link>
            </div>
          </div>
        )}
        {links.map((l) => {
          const name = userById[l.client_id] ?? "Aluno";
          return (
            <Link
              key={l.id}
              href={`/personal/alunos/${l.client_id}`}
              className="atlas-card flex items-center gap-3"
            >
              <div className="h-12 w-12 rounded-full bg-atlas-balance flex items-center justify-center text-lg font-bold text-atlas-energy">
                {name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{name}</div>
                <div className="text-xs text-atlas-muted">
                  {l.goal ?? "Objetivo não definido"}
                </div>
              </div>
              <span className="atlas-chip-energy">
                <Flame size={12} /> {l.status ?? "ativo"}
              </span>
              <ChevronRight className="text-atlas-muted" size={16} />
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
