import { ConcludedClient } from "./ConcludedClient";

export default async function Concluido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  return <ConcludedClient sp={sp} backHref="/cliente" />;
}
