import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { safeList, safeFindOne, safeFindById } from "@/lib/safe";

import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { ProgressRing } from "@/components/brand/ProgressRing";
import { VolumeBars } from "@/components/brand/VolumeBars";
import { ChevronLeft, Plus, Bell } from "lucide-react";

export default async function ClientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [profile, stats, sessionsRes, workoutsRes] = await Promise.all([
    safeFindById<{ full_name: string | null }>("users", id),
    safeFindOne<{
      xp: number;
      level: number;
      streak_days: number;
      longest_streak: number;
      total_sessions: number;
    }>("client_stats", { where: `(client_id,eq,${id})` }),
    safeList<{ id: string; started_at: string; total_volume_kg: number; perceived_effort: number }>(
      "sessions",
      { where: `(client_id,eq,${id})`, sort: "-started_at", limit: 7 },
    ),
    safeList<{ id: string; name: string; weekday: number | null }>("workouts", {
      where: `(client_id,eq,${id})`,
      sort: "-created_at",
      limit: 50,
    }),
  ]);

  const sessions = sessionsRes.list;
  const workouts = workoutsRes.list;

  const maxVol = Math.max(1, ...sessions.map((s) => Number(s.total_volume_kg ?? 0)));
  const bars = Array.from({ length: 7 }).map((_, i) => {
    const s = sessions[i];
    return s ? Number(s.total_volume_kg ?? 0) / maxVol : 0;
  });

  return (
    <AppShell bottomNav={<PersonalNav />}>
      <Link
        href="/personal/alunos"
        className="inline-flex items-center text-atlas-muted text-sm mb-3"
      >
        <ChevronLeft size={16} /> Alunos
      </Link>

      <div className="atlas-card flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-atlas-balance flex items-center justify-center text-2xl font-bold text-atlas-energy">
          {(profile?.full_name ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-xl font-bold">{profile?.full_name}</div>
          <div className="text-xs text-atlas-muted">
            Nível {stats?.level ?? 1} · {stats?.xp ?? 0} XP
          </div>
        </div>
        <ProgressRing
          value={Math.min(100, ((stats?.streak_days ?? 0) / 30) * 100)}
          size={72}
          label={<span className="text-atlas-energy text-xl font-bold">{stats?.streak_days ?? 0}</span>}
          sublabel="streak"
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="atlas-card-muted text-center">
          <div className="text-xs text-atlas-muted">Sessões</div>
          <div className="text-2xl font-bold">{stats?.total_sessions ?? 0}</div>
        </div>
        <div className="atlas-card-muted text-center">
          <div className="text-xs text-atlas-muted">Maior streak</div>
          <div className="text-2xl font-bold">{stats?.longest_streak ?? 0}</div>
        </div>
        <div className="atlas-card-muted text-center">
          <div className="text-xs text-atlas-muted">XP</div>
          <div className="text-2xl font-bold">{stats?.xp ?? 0}</div>
        </div>
      </div>

      <div className="mt-4 atlas-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-atlas-muted">
              Volume últimos 7 treinos
            </div>
            <div className="text-2xl font-bold">
              {sessions.reduce((acc, s) => acc + Number(s.total_volume_kg ?? 0), 0)} kg
            </div>
          </div>
          <Link
            href={`/personal/avisos/novo?client=${id}`}
            className="atlas-btn-ghost text-xs py-2"
          >
            <Bell size={14} /> Enviar aviso
          </Link>
        </div>
        <VolumeBars values={bars} highlightIndex={0} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Treinos do aluno</h2>
          <Link
            href={`/personal/treinos/novo?client=${id}`}
            className="atlas-btn-primary text-xs py-2"
          >
            <Plus size={14} /> Novo treino
          </Link>
        </div>
        <div className="space-y-2">
          {workouts.length === 0 && (
            <div className="atlas-card-muted text-sm text-atlas-muted">
              Sem treinos atribuídos ainda.
            </div>
          )}
          {workouts.map((w) => (
            <Link
              key={w.id}
              href={`/personal/treinos/${w.id}`}
              className="atlas-card-muted block"
            >
              <div className="font-medium">{w.name}</div>
              <div className="text-xs text-atlas-muted">
                {w.weekday !== null && w.weekday !== undefined
                  ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][w.weekday]
                  : "Sem dia fixo"}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
