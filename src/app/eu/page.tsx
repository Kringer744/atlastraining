import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { findById, findOne, list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { EuNav } from "@/components/app/EuNav";
import { ProgressRing } from "@/components/brand/ProgressRing";
import { ActivityDots } from "@/components/brand/ActivityDots";
import { VolumeBars } from "@/components/brand/VolumeBars";
import { Play, Plus, Trophy, Flame, ArrowRight, Droplet, Moon, BarChart3 } from "lucide-react";
import { levelFromXp } from "@/lib/utils";

export default async function EuHome() {
  const session = await requireUser();

  const profile = await findById<{ full_name: string | null; created_at: string | null }>("users", session.sub);
  const stats = await findOne<{
    xp: number;
    streak_days: number;
    longest_streak: number;
    total_sessions: number;
  }>("client_stats", { where: `(client_id,eq,${session.sub})` });
  const workoutsRes = await list<{ id: string; name: string; weekday: number | null }>(
    "workouts",
    { where: `(client_id,eq,${session.sub})`, sort: "-created_at", limit: 50 },
  );
  const sessionsRes = await list<{ id: string; started_at: string; total_volume_kg: number }>(
    "sessions",
    { where: `(client_id,eq,${session.sub})`, sort: "-started_at", limit: 100 },
  );
  const medalsRes = await list<{ id: string; title: string }>("achievements", {
    where: `(client_id,eq,${session.sub})`,
    sort: "-unlocked_at",
    limit: 3,
  });

  const firstName = (profile?.full_name ?? "Atleta").split(" ")[0];
  const xp = stats?.xp ?? 0;
  const lvl = levelFromXp(xp);
  const ringPct = (lvl.intoLevel / lvl.neededForNext) * 100;
  const streak = stats?.streak_days ?? 0;
  const today = new Date().getDay();
  const workouts = workoutsRes.list;
  const sessions = sessionsRes.list;
  const medals = medalsRes.list;
  const nextWorkout = workouts.find((w) => w.weekday === today) ?? workouts[0];

  const last7 = sessions.slice(0, 7);
  const maxVol = Math.max(1, ...last7.map((s) => Number(s.total_volume_kg ?? 0)));
  const bars = Array.from({ length: 7 }).map((_, i) => {
    const s = last7[i];
    return s ? Number(s.total_volume_kg ?? 0) / maxVol : 0;
  });
  const totalVolume = last7.reduce(
    (acc, s) => acc + Number(s.total_volume_kg ?? 0),
    0,
  );
  const sessionDates = sessions.map((s) => s.started_at.slice(0, 10));

  return (
    <AppShell
      title={`Olá, ${firstName}`}
      subtitle="Seu Atlas pessoal."
      actions={
        <Link href="/eu/treinos/novo" className="atlas-btn-primary text-sm py-2">
          <Plus size={16} /> Treino
        </Link>
      }
      bottomNav={<EuNav />}
    >
      <div className="atlas-card flex items-center gap-4">
        <ProgressRing
          value={ringPct}
          size={96}
          label={<span className="text-atlas-energy text-2xl font-bold">{streak}</span>}
          sublabel="dias em sequência"
        />
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-atlas-muted">
            Nível {lvl.level}
          </div>
          <div className="text-2xl font-bold">{xp} XP</div>
          <div className="text-xs text-atlas-muted">
            {lvl.neededForNext - lvl.intoLevel} XP para o próximo nível
          </div>
        </div>
      </div>

      <div className="mt-3 atlas-card">
        <div className="text-xs uppercase tracking-wider text-atlas-muted">
          Próximo treino
        </div>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold">
              {nextWorkout?.name ?? "Você ainda não criou um treino"}
            </div>
            <div className="text-xs text-atlas-muted">
              {nextWorkout?.weekday !== null && nextWorkout?.weekday !== undefined
                ? ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][nextWorkout.weekday]
                : "Sem dia fixo"}
            </div>
          </div>
          {nextWorkout ? (
            <Link
              href={`/eu/treinos/${nextWorkout.id}/iniciar`}
              className="atlas-btn-primary"
            >
              <Play size={16} /> Iniciar
            </Link>
          ) : (
            <Link href="/eu/treinos/novo" className="atlas-btn-primary">
              <Plus size={16} /> Criar
            </Link>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="atlas-card-muted text-center">
          <div className="text-xs text-atlas-muted">Sessões</div>
          <div className="text-xl font-bold">{stats?.total_sessions ?? 0}</div>
        </div>
        <div className="atlas-card-muted text-center">
          <div className="text-xs text-atlas-muted">Maior streak</div>
          <div className="text-xl font-bold">{stats?.longest_streak ?? 0}</div>
        </div>
        <div className="atlas-card-muted text-center">
          <div className="text-xs text-atlas-muted">Volume 7d</div>
          <div className="text-xl font-bold">{Math.round(totalVolume)}</div>
        </div>
      </div>

      <div className="mt-4">
        <ActivityDots
          startDate={profile?.created_at?.slice(0, 10)}
          sessionDates={sessionDates}
        />
      </div>

      <div className="mt-4 atlas-card">
        <div className="text-xs uppercase tracking-wider text-atlas-muted">
          Volume últimos 7 treinos
        </div>
        <div className="text-2xl font-bold">{Math.round(totalVolume)} kg</div>
        <div className="mt-3">
          <VolumeBars values={bars} highlightIndex={0} />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="text-atlas-energy" size={18} /> Últimas medalhas
          </h2>
          <Link href="/eu/conquistas" className="text-xs text-atlas-energy">
            Ver tudo <ArrowRight size={12} className="inline" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {medals.length === 0 && (
            <div className="col-span-3 atlas-card-muted text-sm text-atlas-muted">
              Treine pra desbloquear suas primeiras medalhas!
            </div>
          )}
          {medals.map((m) => (
            <div key={m.id} className="atlas-card-muted text-center">
              <div className="text-3xl">🏅</div>
              <div className="text-xs font-medium mt-1">{m.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.25em] text-atlas-energy mb-2">
          Bem-estar
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Link href="/eu/agua" className="atlas-card flex flex-col items-start gap-1 hover:border-[#4FC3F7]/40 transition">
            <Droplet className="text-[#4FC3F7]" />
            <div className="font-semibold mt-1 text-sm">Hidratação</div>
            <div className="text-[10px] text-atlas-muted">meta diária</div>
          </Link>
          <Link href="/eu/sono" className="atlas-card flex flex-col items-start gap-1 hover:border-[#7B6DFF]/40 transition">
            <Moon className="text-[#7B6DFF]" />
            <div className="font-semibold mt-1 text-sm">Sono</div>
            <div className="text-[10px] text-atlas-muted">modo soneca</div>
          </Link>
          <Link href="/eu/evolucao" className="atlas-card flex flex-col items-start gap-1 hover:border-atlas-energy/40 transition">
            <BarChart3 className="text-atlas-energy" />
            <div className="font-semibold mt-1 text-sm">Medidas</div>
            <div className="text-[10px] text-atlas-muted">peso/corpo</div>
          </Link>
        </div>
      </div>

      {streak >= 3 && (
        <div className="mt-4 atlas-card flex items-center gap-3 bg-atlas-energy/10 border-atlas-energy/30">
          <Flame className="text-atlas-energy" />
          <div className="text-sm">
            Você está com <span className="font-bold text-atlas-energy">{streak} dias</span> de sequência. Não pare agora!
          </div>
        </div>
      )}
    </AppShell>
  );
}
