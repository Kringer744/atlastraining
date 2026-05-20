import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { NovoTreinoForm } from "./NovoTreinoForm";
import { safeList } from "@/lib/safe";

export default async function NovoTreinoPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const sp = await searchParams;
  const session = await requireUser();

  const { list: links } = await safeList<{ client_id: string }>("coach_clients", {
    where: `(coach_id,eq,${session.sub})`,
    fields: "client_id",
    limit: 200,
  });
  let options: { id: string; full_name: string }[] = [];
  const ids = [...new Set(links.map((l) => l.client_id).filter(Boolean))];
  if (ids.length > 0) {
    const where = ids.map((id) => `(id,eq,${id})`).join("~or");
    const r = await safeList<{ id: string; full_name: string | null }>("users", {
      where,
      fields: "id,full_name",
    });
    options = r.list.map((u) => ({ id: u.id, full_name: u.full_name ?? "Aluno" }));
  }

  return (
    <AppShell title="Novo treino" subtitle="Crie manual ou envie um PDF" bottomNav={<PersonalNav />}>
      <NovoTreinoForm clients={options} preselectClient={sp.client} />
    </AppShell>
  );
}
