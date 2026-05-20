import { ConcludedClient } from "@/app/cliente/treinos/[id]/concluido/ConcludedClient";

export default async function ConcluidoEu({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  return <ConcludedClient sp={sp} backHref="/eu" />;
}
