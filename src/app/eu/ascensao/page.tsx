import { requireUser } from "@/lib/auth/server";
import { findOne, list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { EuNav } from "@/components/app/EuNav";
import { AscensaoView } from "@/components/app/AscensaoView";

const TOTAL_ACHIEVEMENTS = 7;

export default async function AscensaoEu() {
  const session = await requireUser();

  const stats = await findOne<{
    xp: number;
    streak_days: number;
  }>("client_stats", { where: `(client_id,eq,${session.sub})` });

  const { list: medals } = await list<{ id: string }>("achievements", {
    where: `(client_id,eq,${session.sub})`,
    fields: "id",
    limit: 50,
  });

  return (
    <AppShell title="" bottomNav={<EuNav />}>
      <AscensaoView
        xp={stats?.xp ?? 0}
        streakDays={stats?.streak_days ?? 0}
        achievementsUnlocked={medals.length}
        achievementsTotal={TOTAL_ACHIEVEMENTS}
      />
    </AppShell>
  );
}
