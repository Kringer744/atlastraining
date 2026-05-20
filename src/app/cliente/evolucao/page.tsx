import { requireUser } from "@/lib/auth/server";
import { list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { ClienteNav } from "@/components/app/ClienteNav";
import { addMeasurement } from "./actions";
import { formatDateBR } from "@/lib/utils";

export default async function EvolucaoPage() {
  const session = await requireUser();
  const { list: measures } = await list<{
    id: string;
    measured_at: string;
    weight_kg: number | null;
    body_fat_pct: number | null;
    note: string | null;
  }>("measurements", {
    where: `(client_id,eq,${session.sub})`,
    sort: "-measured_at",
    limit: 20,
  });

  const latest = measures[0];
  const first = measures[measures.length - 1];
  const deltaWeight =
    latest?.weight_kg && first?.weight_kg
      ? Number(latest.weight_kg) - Number(first.weight_kg)
      : null;

  return (
    <AppShell title="Evolução" subtitle="Suas medidas e progresso" bottomNav={<ClienteNav />}>
      <div className="grid grid-cols-2 gap-3">
        <div className="atlas-card-muted">
          <div className="text-xs text-atlas-muted">Peso atual</div>
          <div className="text-2xl font-bold">
            {latest?.weight_kg ? `${latest.weight_kg} kg` : "—"}
          </div>
          {deltaWeight !== null && (
            <div
              className={
                "text-xs " + (deltaWeight <= 0 ? "text-atlas-energy" : "text-red-300")
              }
            >
              {deltaWeight > 0 ? "+" : ""}
              {deltaWeight.toFixed(1)} kg vs início
            </div>
          )}
        </div>
        <div className="atlas-card-muted">
          <div className="text-xs text-atlas-muted">% gordura</div>
          <div className="text-2xl font-bold">
            {latest?.body_fat_pct ? `${latest.body_fat_pct}%` : "—"}
          </div>
        </div>
      </div>

      <form action={addMeasurement} className="atlas-card mt-4 space-y-2">
        <div className="text-xs uppercase tracking-wider text-atlas-muted">
          Registrar medidas
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input name="weight_kg" placeholder="Peso (kg)" inputMode="decimal" className="atlas-input" />
          <input name="body_fat_pct" placeholder="% gordura" inputMode="decimal" className="atlas-input" />
          <input name="waist_cm" placeholder="Cintura (cm)" inputMode="decimal" className="atlas-input" />
          <input name="chest_cm" placeholder="Tórax (cm)" inputMode="decimal" className="atlas-input" />
          <input name="arm_cm" placeholder="Braço (cm)" inputMode="decimal" className="atlas-input" />
          <input name="thigh_cm" placeholder="Coxa (cm)" inputMode="decimal" className="atlas-input" />
        </div>
        <input name="note" placeholder="Notas (opcional)" className="atlas-input" />
        <button className="atlas-btn-primary w-full">Salvar</button>
      </form>

      <div className="mt-4 space-y-2">
        {measures.map((m) => (
          <div key={m.id} className="atlas-card-muted flex items-center justify-between">
            <div className="text-sm">
              {formatDateBR(m.measured_at)}
              {m.note && <span className="text-atlas-muted"> · {m.note}</span>}
            </div>
            <div className="text-right text-xs">
              {m.weight_kg && <div>{m.weight_kg} kg</div>}
              {m.body_fat_pct && <div>{m.body_fat_pct}% gordura</div>}
            </div>
          </div>
        ))}
        {measures.length === 0 && (
          <div className="atlas-card-muted text-sm text-atlas-muted">
            Sem medidas registradas. Comece registrando seu peso atual.
          </div>
        )}
      </div>
    </AppShell>
  );
}
