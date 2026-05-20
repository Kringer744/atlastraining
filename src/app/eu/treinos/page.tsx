import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { EuNav } from "@/components/app/EuNav";
import { Plus, FileText, Play } from "lucide-react";

export default async function EuTreinos() {
  const session = await requireUser();
  const { list: workouts } = await list<{
    id: string;
    name: string;
    weekday: number | null;
    source: string;
    description: string | null;
  }>("workouts", {
    where: `(client_id,eq,${session.sub})`,
    sort: "weekday",
    limit: 200,
  });

  return (
    <AppShell
      title="Meus treinos"
      actions={
        <Link href="/eu/treinos/novo" className="atlas-btn-primary text-sm py-2">
          <Plus size={16} /> Novo
        </Link>
      }
      bottomNav={<EuNav />}
    >
      <div className="space-y-2">
        {workouts.length === 0 && (
          <div className="atlas-card text-center text-atlas-muted">
            Você ainda não tem treinos.
            <div className="mt-3">
              <Link href="/eu/treinos/novo" className="atlas-btn-primary">
                <Plus size={16} /> Criar primeiro treino
              </Link>
            </div>
          </div>
        )}
        {workouts.map((w) => (
          <div key={w.id} className="atlas-card">
            <div className="flex items-center justify-between gap-3">
              <Link href={`/eu/treinos/${w.id}`} className="flex-1">
                <div className="font-semibold">{w.name}</div>
                <div className="text-xs text-atlas-muted">
                  {w.weekday !== null && w.weekday !== undefined
                    ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][w.weekday]
                    : "Sem dia fixo"}
                  {w.description ? ` · ${w.description}` : ""}
                </div>
              </Link>
              {w.source === "pdf" && (
                <Link href={`/eu/treinos/${w.id}`} className="atlas-chip">
                  <FileText size={12} /> PDF
                </Link>
              )}
              <Link
                href={`/eu/treinos/${w.id}/iniciar`}
                className="atlas-btn-primary text-xs py-2"
              >
                <Play size={14} /> Iniciar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
