import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { ClienteNav } from "@/components/app/ClienteNav";
import { BeneficiosContent } from "@/components/app/BeneficiosContent";

export const dynamic = "force-dynamic";

export default async function ClienteBeneficios() {
  await requireUser();
  return (
    <AppShell
      title="Benefícios Atlas"
      subtitle="Vantagens exclusivas pra quem treina."
      bottomNav={<ClienteNav />}
    >
      <BeneficiosContent />
    </AppShell>
  );
}
