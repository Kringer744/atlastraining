import { requireUser } from "@/lib/auth/server";
import { findOne, list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { EuNav } from "@/components/app/EuNav";
import { formatDateBR, levelFromXp } from "@/lib/utils";
import { ProgressRing } from "@/components/brand/ProgressRing";

const CATALOG = [
  { code: "FIRST_WORKOUT", title: "Primeiro treino", desc: "Comece sua jornada", icon: "🚀" },
  { code: "STREAK_3", title: "3 dias seguidos", desc: "Ritmo!", icon: "🔥" },
  { code: "STREAK_7", title: "1 semana", desc: "Você é consistente.", icon: "⚡" },
  { code: "STREAK_30", title: "1 mês completo", desc: "Disciplina!", icon: "🏔️" },
  { code: "WORKOUTS_10", title: "10 treinos", desc: "A jornada começou.", icon: "💪" },
  { code: "WORKOUTS_50", title: "50 treinos", desc: "Atleta de verdade.", icon: "🏅" },
  { code: "VOLUME_5K", title: "5 toneladas", desc: "Em um único treino.", icon: "🦾" },
];

export default async function ConquistasEu() {
  const session = await requireUser();

  const [medalsRes, stats] = await Promise.all([
    list<{ id: string; code: string; unlocked_at: string }>("achievements", {
      where: `(client_id,eq,${session.sub})`,
      limit: 200,
    }),
    findOne<{ xp: number }>("client_stats", {
      where: `(client_id,eq,${session.sub})`,
    }),
  ]);
  const medals = medalsRes.list;
  const unlocked = new Set(medals.map((m) => m.code));
  const xp = stats?.xp ?? 0;
  const lvl = levelFromXp(xp);

  return (
    <AppShell title="Conquistas" bottomNav={<EuNav />}>
      <div className="atlas-card flex items-center gap-4">
        <ProgressRing
          value={(lvl.intoLevel / lvl.neededForNext) * 100}
          size={96}
          label={<span className="text-atlas-energy text-2xl font-bold">{lvl.level}</span>}
          sublabel="nível"
        />
        <div>
          <div className="text-2xl font-bold">{xp} XP</div>
          <div className="text-xs text-atlas-muted">
            {lvl.neededForNext - lvl.intoLevel} para o próximo nível
          </div>
          <div className="text-xs text-atlas-muted">
            {unlocked.size}/{CATALOG.length} medalhas desbloqueadas
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {CATALOG.map((m) => {
          const have = unlocked.has(m.code);
          const meta = medals.find((x) => x.code === m.code);
          return (
            <div
              key={m.code}
              className={"atlas-card text-center " + (have ? "" : "opacity-50 grayscale")}
            >
              <div className="text-4xl">{m.icon}</div>
              <div className="mt-2 font-semibold">{m.title}</div>
              <div className="text-xs text-atlas-muted">{m.desc}</div>
              {have && meta && (
                <div className="text-[10px] text-atlas-energy mt-1">
                  Desbloqueada em {formatDateBR(meta.unlocked_at)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
