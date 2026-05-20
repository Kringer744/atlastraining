import { requireUser } from "@/lib/auth/server";
import { getAthletesRanking } from "@/lib/ranking";
import { AppShell } from "@/components/app/AppShell";
import { EuNav } from "@/components/app/EuNav";
import { RankingList } from "@/components/app/RankingList";

export default async function RankingEu() {
  const session = await requireUser();
  const users = await getAthletesRanking();
  return (
    <AppShell title="" bottomNav={<EuNav />}>
      <RankingList
        users={users}
        myId={session.sub}
        title="Atletas em ascensão"
        hint="Você e todos os outros atletas — quem treina mais sobe mais."
      />
    </AppShell>
  );
}
