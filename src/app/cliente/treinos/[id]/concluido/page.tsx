import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ClienteNav } from "@/components/app/ClienteNav";
import { ProgressRing } from "@/components/brand/ProgressRing";
import { Trophy } from "lucide-react";

export default async function Concluido({
  searchParams,
}: {
  searchParams: Promise<{ xp?: string; streak?: string }>;
}) {
  const sp = await searchParams;
  const xp = Number(sp.xp ?? 0);
  const streak = Number(sp.streak ?? 0);
  return (
    <AppShell bottomNav={<ClienteNav />}>
      <div className="atlas-card text-center max-w-md mx-auto">
        <div className="text-5xl">🏆</div>
        <h1 className="text-2xl font-bold mt-2">Treino concluído!</h1>
        <p className="text-atlas-muted text-sm">Disciplina hoje, resultado amanhã.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="atlas-card-muted flex flex-col items-center">
            <ProgressRing
              value={100}
              size={88}
              label={<span className="text-atlas-energy text-xl font-bold">+{xp}</span>}
              sublabel="XP"
            />
            <div className="mt-2 text-xs text-atlas-muted">ganho nesta sessão</div>
          </div>
          <div className="atlas-card-muted flex flex-col items-center justify-center">
            <Trophy className="text-atlas-energy" />
            <div className="mt-1 text-3xl font-bold">{streak}</div>
            <div className="text-xs text-atlas-muted">dias em sequência</div>
          </div>
        </div>

        <Link href="/cliente" className="atlas-btn-primary w-full mt-6">
          Voltar para o início
        </Link>
      </div>
    </AppShell>
  );
}
