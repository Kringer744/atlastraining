import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { ClienteNav } from "@/components/app/ClienteNav";
import { FileText, Play } from "lucide-react";

export default async function MeusTreinos() {
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
    limit: 100,
  });

  return (
    <AppShell title="Meus treinos" bottomNav={<ClienteNav />}>
      <div className="space-y-2">
        {workouts.length === 0 && (
          <div className="atlas-card text-center text-atlas-muted">
            Seu personal ainda não criou treinos para você.
          </div>
        )}
        {workouts.map((w) => (
          <div key={w.id} className="atlas-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="font-semibold">{w.name}</div>
                <div className="text-xs text-atlas-muted">
                  {w.weekday !== null && w.weekday !== undefined
                    ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][w.weekday]
                    : "Sem dia fixo"}
                  {w.description ? ` · ${w.description}` : ""}
                </div>
              </div>
              {w.source === "pdf" && (
                <Link href={`/cliente/treinos/${w.id}`} className="atlas-chip">
                  <FileText size={12} /> PDF
                </Link>
              )}
              <Link
                href={`/cliente/treinos/${w.id}/iniciar`}
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
