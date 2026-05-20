import { requireUser } from "@/lib/auth/server";
import { safeList } from "@/lib/safe";

import { AppShell } from "@/components/app/AppShell";
import { EuNav } from "@/components/app/EuNav";
import { addOwnMeasurement } from "../treinos/actions";
import { formatDateBR } from "@/lib/utils";
import { LineChart, BarChart } from "@/components/app/MiniChart";
import { TrendingDown, TrendingUp, Droplet, Dumbbell, Trophy, Scale } from "lucide-react";

const MONTH_LABELS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const SHORT_WD = ["D","S","T","Q","Q","S","S"];

export default async function EvolucaoEu() {
  const session = await requireUser();

  const [measuresRes, sessionsRes, waterRes, prsRes] = await Promise.all([
    safeList<{
      id: string;
      measured_at: string;
      weight_kg: number | null;
      body_fat_pct: number | null;
      note: string | null;
    }>("measurements", {
      where: `(client_id,eq,${session.sub})`,
      sort: "-measured_at",
      limit: 24,
    }),
    safeList<{ started_at: string; total_volume_kg: number }>("sessions", {
      where: `(client_id,eq,${session.sub})`,
      sort: "-started_at",
      limit: 365,
    }),
    safeList<{ logged_at: string; amount_ml: number }>("water_logs", {
      where: `(client_id,eq,${session.sub})`,
      sort: "-logged_at",
      limit: 500,
    }),
    safeList<{ id: string; code: string; title: string; unlocked_at: string }>("achievements", {
      where: `(client_id,eq,${session.sub})~and(code,like,PR_%)`,
      sort: "-unlocked_at",
      limit: 10,
    }),
  ]);
  const measures = measuresRes.list;
  const sessions = sessionsRes.list;
  const waters = waterRes.list;
  const prs = prsRes.list;

  const weightSeries = [...measures]
    .reverse()
    .filter((m) => m.weight_kg != null)
    .map((m) => ({ x: m.measured_at.slice(5, 10), y: Number(m.weight_kg) }));
  const latest = measures[0];
  const first = measures[measures.length - 1];
  const deltaWeight =
    latest?.weight_kg && first?.weight_kg
      ? Number(latest.weight_kg) - Number(first.weight_kg)
      : null;

  const months: { label: string; value: number; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: MONTH_LABELS[d.getMonth()], value: 0 });
  }
  for (const s of sessions) {
    const key = s.started_at.slice(0, 7);
    const m = months.find((x) => x.key === key);
    if (m) m.value++;
  }

  const waterDays: { label: string; value: number; key: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    waterDays.push({
      key: d.toISOString().slice(0, 10),
      label: SHORT_WD[d.getDay()],
      value: 0,
    });
  }
  for (const w of waters) {
    const key = w.logged_at.slice(0, 10);
    const m = waterDays.find((x) => x.key === key);
    if (m) m.value += Number(w.amount_ml ?? 0);
  }
  const waterChart = waterDays.map((d) => ({ ...d, value: d.value / 1000 }));

  const volSeries = [...sessions]
    .slice(0, 14)
    .reverse()
    .map((s) => ({
      x: s.started_at.slice(5, 10),
      y: Number(s.total_volume_kg ?? 0),
    }));

  const totalSessions = sessions.length;
  const last30Days = sessions.filter(
    (s) => new Date(s.started_at).getTime() > Date.now() - 30 * 86400000,
  ).length;
  const totalLitersWeek = waterDays.reduce((a, b) => a + b.value, 0) / 1000;

  return (
    <AppShell title="Evolução" subtitle="Seus números reais" bottomNav={<EuNav />}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="atlas-card">
          <div className="text-[10px] uppercase tracking-wider text-atlas-muted">Peso atual</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            <Scale className="text-atlas-energy" size={18} />
            {latest?.weight_kg ? `${latest.weight_kg} kg` : "—"}
          </div>
          {deltaWeight !== null && (
            <div className={"text-[11px] mt-1 flex items-center gap-1 " + (deltaWeight <= 0 ? "text-atlas-energy" : "text-red-300")}>
              {deltaWeight <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
              {deltaWeight > 0 ? "+" : ""}{deltaWeight.toFixed(1)} kg vs início
            </div>
          )}
        </div>
        <div className="atlas-card">
          <div className="text-[10px] uppercase tracking-wider text-atlas-muted">% gordura</div>
          <div className="text-2xl font-bold">{latest?.body_fat_pct ? `${latest.body_fat_pct}%` : "—"}</div>
        </div>
        <div className="atlas-card">
          <div className="text-[10px] uppercase tracking-wider text-atlas-muted">Treinos (30d)</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="text-atlas-energy" size={18} />{last30Days}
          </div>
          <div className="text-[11px] text-atlas-muted mt-1">de {totalSessions} no total</div>
        </div>
        <div className="atlas-card">
          <div className="text-[10px] uppercase tracking-wider text-atlas-muted">Água (7d)</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            <Droplet className="text-[#4FC3F7]" size={18} />{totalLitersWeek.toFixed(1)} L
          </div>
        </div>
      </div>

      <div className="atlas-card mb-3">
        <div className="text-[11px] uppercase tracking-wider text-atlas-muted mb-2">📉 Peso ao longo do tempo</div>
        {weightSeries.length >= 2 ? (
          <LineChart data={weightSeries.map((d) => ({ x: d.x, y: d.y }))} />
        ) : (
          <div className="text-sm text-atlas-muted text-center py-4">
            Registre seu peso por 2 ou mais meses pra ver o gráfico.
          </div>
        )}
      </div>

      <div className="atlas-card mb-3">
        <div className="text-[11px] uppercase tracking-wider text-atlas-muted mb-2">💪 Treinos por mês</div>
        <BarChart data={months} highlightLast />
      </div>

      {volSeries.length >= 2 && (
        <div className="atlas-card mb-3">
          <div className="text-[11px] uppercase tracking-wider text-atlas-muted mb-2">📊 Volume nos últimos treinos</div>
          <LineChart data={volSeries} color="#C6FF00" />
        </div>
      )}

      <div className="atlas-card mb-3">
        <div className="text-[11px] uppercase tracking-wider text-atlas-muted mb-2">💧 Hidratação (litros/dia)</div>
        <BarChart data={waterChart} color="#4FC3F7" highlightLast />
      </div>

      {prs.length > 0 && (
        <div className="atlas-card mb-3">
          <div className="text-[11px] uppercase tracking-wider text-atlas-muted mb-2 flex items-center gap-1">
            <Trophy size={12} className="text-atlas-energy" /> PRs recentes
          </div>
          <div className="space-y-1.5">
            {prs.map((p) => (
              <div key={p.id} className="atlas-card-muted py-2">
                <div className="font-semibold text-sm">{p.title}</div>
                <div className="text-[11px] text-atlas-muted">{formatDateBR(p.unlocked_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form action={addOwnMeasurement} className="atlas-card mt-4 space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-atlas-muted">Registrar medidas</div>
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

      {measures.length > 0 && (
        <div className="atlas-card mt-3">
          <div className="text-[11px] uppercase tracking-wider text-atlas-muted mb-2">Histórico de medidas</div>
          <div className="space-y-1.5">
            {measures.map((m) => (
              <div key={m.id} className="atlas-card-muted flex items-center justify-between py-2">
                <div className="text-sm">
                  {formatDateBR(m.measured_at)}
                  {m.note && <span className="text-atlas-muted"> · {m.note}</span>}
                </div>
                <div className="text-right text-xs">
                  {m.weight_kg && <div>{m.weight_kg} kg</div>}
                  {m.body_fat_pct && <div>{m.body_fat_pct}%</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
