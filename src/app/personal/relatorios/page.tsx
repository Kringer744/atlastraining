import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { VolumeBars } from "@/components/brand/VolumeBars";
import { nocoDateFilter, relativeTimePt } from "@/lib/utils";
import { safeList } from "@/lib/safe";

export default async function Relatorios() {
  const session = await requireUser();

  const { list: links } = await safeList<{ client_id: string }>("coach_clients", {
    where: `(coach_id,eq,${session.sub})`,
    fields: "client_id",
    limit: 200,
  });
  const ids = [...new Set(links.map((l) => l.client_id))];

  const since = new Date();
  since.setDate(since.getDate() - 7);

  let sessions: any[] = [];
  if (ids.length > 0) {
    const where =
      "(" +
      ids.map((id) => `(client_id,eq,${id})`).join("~or") +
      `)~and${nocoDateFilter("started_at", "gte", since)}`;
    const r = await safeList<any>("sessions", { where, sort: "-started_at", limit: 200 });
    sessions = r.list;
  }

  let userById: Record<string, string> = {};
  if (ids.length > 0) {
    const where = ids.map((id) => `(id,eq,${id})`).join("~or");
    const r = await safeList<{ id: string; full_name: string | null }>("users", {
      where,
      fields: "id,full_name",
    });
    for (const u of r.list) userById[u.id] = u.full_name ?? "Aluno";
  }

  const byDay = Array(7).fill(0);
  for (const s of sessions) {
    const d = new Date(s.started_at).getDay();
    byDay[d] += Number(s.total_volume_kg ?? 0);
  }
  const max = Math.max(1, ...byDay);
  const bars = byDay.map((v) => v / max);
  const totalVolume = byDay.reduce((a, b) => a + b, 0);

  return (
    <AppShell
      title="Relatórios"
      subtitle="Últimos 7 dias"
      bottomNav={<PersonalNav />}
    >
      <div className="atlas-card">
        <div className="text-xs uppercase tracking-wider text-atlas-muted">
          Volume total
        </div>
        <div className="text-3xl font-bold mt-1">{Math.round(totalVolume)} kg</div>
        <div className="mt-4">
          <VolumeBars
            values={bars}
            labels={["D", "S", "T", "Q", "Q", "S", "S"]}
            highlightIndex={bars.indexOf(Math.max(...bars))}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="atlas-card-muted flex items-center justify-between">
            <div>
              <div className="font-medium">{userById[s.client_id] ?? "Aluno"}</div>
              <div className="text-xs text-atlas-muted">{relativeTimePt(s.started_at)}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{Math.round(Number(s.total_volume_kg ?? 0))} kg</div>
              <div className="text-xs text-atlas-muted">PSE {s.perceived_effort ?? "—"}</div>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="atlas-card-muted text-sm text-atlas-muted">
            Sem sessões no período.
          </div>
        )}
      </div>
    </AppShell>
  );
}
