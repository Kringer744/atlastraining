import { requireUser } from "@/lib/auth/server";
import { getAthletesRanking } from "@/lib/ranking";
import { AppShell } from "@/components/app/AppShell";
import { ClienteNav } from "@/components/app/ClienteNav";
import { RankingList } from "@/components/app/RankingList";

export default async function RankingCliente() {
  const session = await requireUser();
  const users = await getAthletesRanking();
  return (
    <AppShell title="" bottomNav={<ClienteNav />}>
      <RankingList
        users={users}
        myId={session.sub}
        title="Atletas em ascensão"
        hint="Você e todos os outros atletas — quem treina mais sobe mais."
      />
    </AppShell>
  );
}
