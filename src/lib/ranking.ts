import { count, list } from "@/lib/nocodb/client";
import { levelFromXp } from "@/lib/utils";
import type { RankedUser } from "@/components/app/RankingList";

const TOP_LIMIT = 50;

// Ranking de atletas (client + solo) ordenado por XP
export async function getAthletesRanking(): Promise<RankedUser[]> {
  // Pega todos os client_stats com xp > 0 (atletas ativos)
  const { list: stats } = await list<{
    client_id: string;
    xp: number;
    streak_days: number;
  }>("client_stats", {
    sort: "-xp",
    limit: TOP_LIMIT,
  });

  if (stats.length === 0) return [];

  // Busca os nomes em batch
  const ids = stats.map((s) => s.client_id);
  const where = ids.map((id) => `(id,eq,${id})`).join("~or");
  const { list: users } = await list<{
    id: string;
    full_name: string | null;
    role: string;
  }>("users", { where, fields: "id,full_name,role", limit: ids.length });

  const userById: Record<string, { name: string; role: string }> = {};
  for (const u of users) {
    userById[u.id] = {
      name: u.full_name ?? "Atleta",
      role: u.role,
    };
  }

  return stats
    .filter((s) => userById[s.client_id]) // só quem ainda existe
    .map((s) => {
      const u = userById[s.client_id];
      const lvl = levelFromXp(s.xp);
      return {
        id: s.client_id,
        name: u.name,
        score: s.xp,
        scoreLabel: `${s.xp.toLocaleString("pt-BR")} XP`,
        subtitle:
          (u.role === "solo" ? "Atlas Pessoal" : "Aluno") +
          (s.streak_days > 0 ? ` · 🔥 ${s.streak_days}` : ""),
        badge: `Nv ${lvl.level}`,
      };
    });
}

// Ranking de personais por nº de alunos ativos
export async function getPersonalsRanking(): Promise<RankedUser[]> {
  // Busca todos os personais
  const { list: personals } = await list<{ id: string; full_name: string | null }>(
    "users",
    {
      where: `(role,eq,personal)`,
      fields: "id,full_name",
      limit: TOP_LIMIT,
    },
  );

  if (personals.length === 0) return [];

  // Pra cada personal, conta alunos ativos
  const ranked: RankedUser[] = [];
  for (const p of personals) {
    let activeClients = 0;
    try {
      activeClients = await count(
        "coach_clients",
        `(coach_id,eq,${p.id})~and(status,eq,active)`,
      );
    } catch {
      activeClients = 0;
    }
    ranked.push({
      id: p.id,
      name: p.full_name ?? "Personal",
      score: activeClients,
      scoreLabel: `${activeClients} ${activeClients === 1 ? "aluno" : "alunos"}`,
      subtitle: "Personal Trainer",
      badge: activeClients >= 10 ? "Elite" : activeClients >= 5 ? "Pro" : "Coach",
    });
  }

  return ranked.sort((a, b) => b.score - a.score);
}
