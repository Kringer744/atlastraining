import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { safe, emptyList, safeList, safeFindById, safeCount } from "@/lib/safe";

import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { ProgressRing } from "@/components/brand/ProgressRing";
import { ActivityDots } from "@/components/brand/ActivityDots";
import { Plus, Users, Dumbbell, Bell, ArrowRight, Gift } from "lucide-react";
import { relativeTimePt } from "@/lib/utils";

export default async function PersonalHome() {
  const session = await requireUser();
  const profile = await safe(
    () => safeFindById<{ full_name: string | null }>("users", session.sub),
    null,
    "personal:profile",
  );

  const clientsCount = await safe(
    () =>
      safeCount("coach_clients", `(coach_id,eq,${session.sub})~and(status,eq,active)`),
    0,
    "personal:clientsCount",
  );
  const workoutsCount = await safe(
    () => safeCount("workouts", `(coach_id,eq,${session.sub})`),
    0,
    "personal:workoutsCount",
  );

  const linksRes = await safe(
    () =>
      safeList<{ client_id: string }>("coach_clients", {
        where: `(coach_id,eq,${session.sub})`,
        fields: "client_id",
        limit: 100,
      }),
    emptyList,
    "personal:links",
  );
  const links = linksRes.list;
  const clientIds = links.map((l: any) => l.client_id).filter(Boolean) as string[];

  let sessions: any[] = [];
  let activityDates: string[] = [];
  if (clientIds.length > 0) {
    const where = clientIds.map((id) => `(client_id,eq,${id})`).join("~or");
    const r = await safe(
      () => safeList<any>("sessions", { where, sort: "-started_at", limit: 100 }),
      emptyList,
      "personal:sessions",
    );
    sessions = r.list.slice(0, 5);
    activityDates = r.list.map((s: any) =>
      typeof s.started_at === "string" ? s.started_at.slice(0, 10) : "",
    );
  }
  const myProfile = await safe(
    () => safeFindById<{ created_at: string | null }>("users", session.sub),
    null,
    "personal:myProfile",
  );
  const clientById: Record<string, string> = {};
  if (sessions.length > 0) {
    const ids = [...new Set(sessions.map((s) => s.client_id))];
    const where = ids.map((id) => `(id,eq,${id})`).join("~or");
    const r = await safe(
      () =>
        safeList<{ id: string; full_name: string | null }>("users", {
          where,
          fields: "id,full_name",
        }),
      emptyList,
      "personal:clients",
    );
    for (const u of r.list as any[]) clientById[u.id] = u.full_name ?? "Aluno";
  }

  const firstName = (profile?.full_name ?? "Personal").split(" ")[0];

  return (
    <AppShell
      title={`Olá, ${firstName}`}
      subtitle="Bora evoluir seus alunos hoje."
      actions={
        <Link href="/personal/alunos/novo" className="atlas-btn-primary text-sm py-2">
          <Plus size={16} /> Novo aluno
        </Link>
      }
      bottomNav={<PersonalNav />}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="atlas-card">
          <div className="flex items-center gap-3">
            <ProgressRing
              value={Math.min(100, clientsCount * 10)}
              size={64}
              stroke={5}
              label={<span className="text-atlas-energy text-lg font-bold">{clientsCount}</span>}
            />
            <div>
              <div className="text-xs uppercase tracking-wider text-atlas-muted">
                Alunos ativos
              </div>
              <div className="font-medium">na sua base</div>
            </div>
          </div>
        </div>
        <div className="atlas-card">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-atlas-energy/15 p-3">
              <Dumbbell className="text-atlas-energy" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-atlas-muted">
                Treinos criados
              </div>
              <div className="text-2xl font-bold">{workoutsCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ActivityDots
          startDate={myProfile?.created_at?.slice(0, 10)}
          sessionDates={activityDates}
        />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Sessões recentes</h2>
          <Link href="/personal/relatorios" className="text-xs text-atlas-energy">
            Ver tudo <ArrowRight size={12} className="inline" />
          </Link>
        </div>
        <div className="space-y-2">
          {sessions.length === 0 && (
            <div className="atlas-card-muted text-sm text-atlas-muted">
              Ainda sem sessões. Quando seus alunos treinarem, vai aparecer aqui.
            </div>
          )}
          {sessions.map((s: any) => (
            <div key={s.id} className="atlas-card-muted flex items-center justify-between">
              <div>
                <div className="font-medium">{clientById[s.client_id] ?? "Aluno"}</div>
                <div className="text-xs text-atlas-muted">
                  {relativeTimePt(s.started_at)} · {Number(s.total_volume_kg ?? 0)} kg de volume
                </div>
              </div>
              <span className="atlas-chip-energy">PSE {s.perceived_effort ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Link href="/personal/alunos" className="atlas-card flex flex-col items-start">
          <Users className="text-atlas-energy" />
          <div className="mt-2 font-semibold">Alunos</div>
          <div className="text-xs text-atlas-muted">Gerenciar base</div>
        </Link>
        <Link href="/personal/treinos/novo" className="atlas-card flex flex-col items-start">
          <Dumbbell className="text-atlas-energy" />
          <div className="mt-2 font-semibold">Novo treino</div>
          <div className="text-xs text-atlas-muted">Manual ou PDF</div>
        </Link>
        <Link href="/personal/avisos" className="atlas-card flex flex-col items-start">
          <Bell className="text-atlas-energy" />
          <div className="mt-2 font-semibold">Avisos</div>
          <div className="text-xs text-atlas-muted">Lembretes ao aluno</div>
        </Link>
      </div>

      <Link
        href="/personal/beneficios"
        className="mt-4 atlas-card flex items-center gap-3 bg-gradient-to-br from-atlas-energy/15 via-atlas-energy/5 to-transparent border-atlas-energy/30 hover:border-atlas-energy/50 transition group"
      >
        <div className="w-11 h-11 rounded-2xl bg-atlas-energy/20 border border-atlas-energy/40 flex items-center justify-center shrink-0">
          <Gift className="text-atlas-energy" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-atlas-contrast flex items-center gap-2">
            Benefícios Atlas
            <span className="text-[9px] font-bold uppercase tracking-wider bg-atlas-energy text-atlas-focus-1 px-1.5 py-0.5 rounded-full">
              novo
            </span>
          </div>
          <div className="text-xs text-atlas-muted">
            Cupons exclusivos pra compartilhar com seus alunos.
          </div>
        </div>
        <ArrowRight className="text-atlas-energy shrink-0 group-hover:translate-x-1 transition" size={18} />
      </Link>
    </AppShell>
  );
}
