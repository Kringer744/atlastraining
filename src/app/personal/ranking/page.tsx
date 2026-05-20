import { requireUser } from "@/lib/auth/server";
import { getPersonalsRanking } from "@/lib/ranking";
import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { RankingList } from "@/components/app/RankingList";

export default async function RankingPersonal() {
  const session = await requireUser();
  const users = await getPersonalsRanking();
  return (
    <AppShell title="" bottomNav={<PersonalNav />}>
      <RankingList
        users={users}
        myId={session.sub}
        title="Top Personals"
        hint="Quem mais transforma alunos lidera. Mais alunos ativos = mais alto."
      />
    </AppShell>
  );
}
