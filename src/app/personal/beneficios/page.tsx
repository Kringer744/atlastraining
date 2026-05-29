import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { BeneficiosContent } from "@/components/app/BeneficiosContent";

export const dynamic = "force-dynamic";

export default async function PersonalBeneficios() {
  await requireUser();
  return (
    <AppShell
      title="Benefícios Atlas"
      subtitle="Compartilhe com seus alunos."
      bottomNav={<PersonalNav />}
    >
      <BeneficiosContent />
    </AppShell>
  );
}
