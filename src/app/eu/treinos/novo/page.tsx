import { AppShell } from "@/components/app/AppShell";
import { EuNav } from "@/components/app/EuNav";
import { NovoTreinoEuForm } from "./NovoTreinoEuForm";

export default async function NovoTreinoEu() {
  return (
    <AppShell title="Novo treino" subtitle="Crie manual ou envie um PDF" bottomNav={<EuNav />}>
      <NovoTreinoEuForm />
    </AppShell>
  );
}
