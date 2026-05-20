import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { ClienteNav } from "@/components/app/ClienteNav";
import { WaterTracker } from "@/components/app/WaterTracker";
import { addWater, setWaterGoal, undoLastWater } from "./actions";
import { nocoDateFilter } from "@/lib/utils";
import { safeList, safeFindById } from "@/lib/safe";

const DEFAULT_GOAL_ML = 2500;

export default async function AguaCliente() {
  const session = await requireUser();
  const profile = await safeFindById<{ daily_water_goal_ml: number | null }>(
    "users",
    session.sub,
  );
  const goalMl = profile?.daily_water_goal_ml ?? DEFAULT_GOAL_ML;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { list: todayLogs } = await safeList<{
    id: string;
    logged_at: string;
    amount_ml: number;
  }>("water_logs", {
    where: `(client_id,eq,${session.sub})~and${nocoDateFilter("logged_at", "gte", startOfToday)}`,
    sort: "-logged_at",
    limit: 50,
  });

  const todayMl = todayLogs.reduce((acc, l) => acc + Number(l.amount_ml ?? 0), 0);

  // últimos 7 dias agregados
  const sevenAgo = new Date();
  sevenAgo.setDate(sevenAgo.getDate() - 7);
  const { list: weekLogs } = await safeList<{ logged_at: string; amount_ml: number }>(
    "water_logs",
    {
      where: `(client_id,eq,${session.sub})~and${nocoDateFilter("logged_at", "gte", sevenAgo)}`,
      sort: "logged_at",
      limit: 500,
    },
  );

  const dayMap = new Map<string, number>();
  for (const l of weekLogs) {
    const day = l.logged_at.slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + Number(l.amount_ml ?? 0));
  }
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    return {
      iso,
      label: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      ml: dayMap.get(iso) ?? 0,
    };
  });
  const maxMl = Math.max(goalMl, ...days.map((d) => d.ml));

  return (
    <AppShell
      title="Hidratação"
      subtitle="Beba água, atleta."
      bottomNav={<ClienteNav />}
    >
      <WaterTracker
        goalMl={goalMl}
        todayMl={todayMl}
        todayLogs={todayLogs}
        onAdd={addWater}
        onUndo={undoLastWater}
      />

      <div className="atlas-card mt-4">
        <div className="text-[11px] uppercase tracking-wider text-atlas-muted mb-2">
          Últimos 7 dias
        </div>
        <div className="flex items-end gap-2 h-24">
          {days.map((d) => {
            const h = Math.max(8, (d.ml / maxMl) * 100);
            const met = d.ml >= goalMl;
            return (
              <div key={d.iso} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className={
                      "w-full rounded-md transition-all " +
                      (met
                        ? "bg-atlas-energy shadow-[0_0_10px_rgba(198,255,0,0.55)]"
                        : "bg-[#4FC3F7]")
                    }
                    style={{ height: `${h}%` }}
                  />
                </div>
                <span className="text-[10px] text-atlas-muted">{d.label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-[11px] text-atlas-muted text-center">
          Linha em verde = bateu a meta
        </div>
      </div>

      <form action={setWaterGoal} className="atlas-card mt-4 space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-atlas-muted">
          Sua meta diária
        </div>
        <div className="flex gap-2">
          <input
            name="goal_ml"
            type="number"
            min={500}
            max={10000}
            step={100}
            defaultValue={goalMl}
            className="atlas-input flex-1"
          />
          <button className="atlas-btn-primary px-5">Salvar</button>
        </div>
        <div className="text-xs text-atlas-muted">
          Recomendado: 35 ml por kg de peso corporal.
        </div>
      </form>
    </AppShell>
  );
}
