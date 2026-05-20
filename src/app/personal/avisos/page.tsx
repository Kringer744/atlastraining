import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { relativeTimePt } from "@/lib/utils";
import { Plus, Bell } from "lucide-react";

export default async function AvisosPage() {
  const session = await requireUser();
  const { list: reminders } = await list<{
    id: string;
    title: string;
    body: string | null;
    created_at: string;
    client_id: string | null;
  }>("reminders", {
    where: `(coach_id,eq,${session.sub})`,
    sort: "-created_at",
    limit: 100,
  });

  const ids = [...new Set(reminders.map((r) => r.client_id).filter(Boolean) as string[])];
  let userById: Record<string, string> = {};
  if (ids.length > 0) {
    const where = ids.map((id) => `(id,eq,${id})`).join("~or");
    const r = await list<{ id: string; full_name: string | null }>("users", {
      where,
      fields: "id,full_name",
    });
    for (const u of r.list) userById[u.id] = u.full_name ?? "Aluno";
  }

  return (
    <AppShell
      title="Avisos & lembretes"
      actions={
        <Link href="/personal/avisos/novo" className="atlas-btn-primary text-sm py-2">
          <Plus size={16} /> Novo
        </Link>
      }
      bottomNav={<PersonalNav />}
    >
      <div className="space-y-2">
        {reminders.length === 0 && (
          <div className="atlas-card text-center text-atlas-muted">
            Nenhum aviso enviado.
          </div>
        )}
        {reminders.map((r) => (
          <div key={r.id} className="atlas-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="text-atlas-energy" size={16} />
                <div className="font-semibold">{r.title}</div>
              </div>
              <span className="text-[11px] text-atlas-muted">
                {relativeTimePt(r.created_at)}
              </span>
            </div>
            {r.body && <p className="text-sm text-atlas-muted mt-1">{r.body}</p>}
            <div className="text-xs text-atlas-muted mt-2">
              Para: {r.client_id ? userById[r.client_id] ?? "Aluno" : "Todos os alunos"}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
