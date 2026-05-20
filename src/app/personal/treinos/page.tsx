import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { Plus, FileText } from "lucide-react";

export default async function TreinosList() {
  const session = await requireUser();
  const { list: workouts } = await list<{
    id: string;
    name: string;
    weekday: number | null;
    source: string;
    client_id: string | null;
  }>("workouts", {
    where: `(coach_id,eq,${session.sub})`,
    sort: "-created_at",
    limit: 200,
  });

  let users: { id: string; full_name: string | null }[] = [];
  const clientIds = [...new Set(workouts.map((w) => w.client_id).filter(Boolean) as string[])];
  if (clientIds.length > 0) {
    const where = clientIds.map((id) => `(id,eq,${id})`).join("~or");
    const r = await list<{ id: string; full_name: string | null }>("users", {
      where,
      fields: "id,full_name",
    });
    users = r.list;
  }
  const userById: Record<string, string> = {};
  for (const u of users) userById[u.id] = u.full_name ?? "Aluno";

  return (
    <AppShell
      title="Treinos"
      actions={
        <Link href="/personal/treinos/novo" className="atlas-btn-primary text-sm py-2">
          <Plus size={16} /> Novo
        </Link>
      }
      bottomNav={<PersonalNav />}
    >
      <div className="space-y-2">
        {workouts.length === 0 && (
          <div className="atlas-card text-center text-atlas-muted">
            Nenhum treino criado.
            <div className="mt-3">
              <Link href="/personal/treinos/novo" className="atlas-btn-primary">
                <Plus size={16} /> Criar primeiro treino
              </Link>
            </div>
          </div>
        )}
        {workouts.map((w) => (
          <Link key={w.id} href={`/personal/treinos/${w.id}`} className="atlas-card block">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{w.name}</div>
                <div className="text-xs text-atlas-muted">
                  {w.client_id ? userById[w.client_id] ?? "Aluno" : "Sem aluno atribuído"} ·{" "}
                  {w.weekday !== null && w.weekday !== undefined
                    ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][w.weekday]
                    : "Sem dia"}
                </div>
              </div>
              {w.source === "pdf" && (
                <span className="atlas-chip">
                  <FileText size={12} /> PDF
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
