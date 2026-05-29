import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { EuNav } from "@/components/app/EuNav";
import { BeneficiosContent } from "@/components/app/BeneficiosContent";

export const dynamic = "force-dynamic";

export default async function EuBeneficios() {
  await requireUser();
  return (
    <AppShell
      title="Benefícios Atlas"
      subtitle="Vantagens exclusivas pra quem treina."
      bottomNav={<EuNav />}
    >
      <BeneficiosContent />
    </AppShell>
  );
}
