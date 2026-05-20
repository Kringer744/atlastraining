import { requireUser } from "@/lib/auth/server";
import { findById, list } from "@/lib/nocodb/client";
import { AppShell } from "@/components/app/AppShell";
import { ClienteNav } from "@/components/app/ClienteNav";
import { Bell } from "lucide-react";
import { relativeTimePt } from "@/lib/utils";
import { markRead } from "./actions";

export default async function ClienteAvisos() {
  const session = await requireUser();

  // O cliente pode receber tanto avisos com client_id == próprio quanto broadcast (client_id null) dos seus coaches.
  const { list: links } = await list<{ coach_id: string }>("coach_clients", {
    where: `(client_id,eq,${session.sub})`,
    fields: "coach_id",
    limit: 50,
  });
  const coachIds = [...new Set(links.map((l) => l.coach_id))];

  const whereParts = [`(client_id,eq,${session.sub})`];
  if (coachIds.length > 0) {
    const coachOr = coachIds.map((id) => `(coach_id,eq,${id})`).join("~or");
    whereParts.push(`((${coachOr})~and(client_id,is,null))`);
  }
  const where = whereParts.join("~or");

  const { list: reminders } = await list<{
    id: string;
    title: string;
    body: string | null;
    coach_id: string;
    created_at: string;
    read_at: string | null;
  }>("reminders", { where, sort: "-created_at", limit: 100 });

  let coachById: Record<string, string> = {};
  if (reminders.length > 0) {
    const ids = [...new Set(reminders.map((r) => r.coach_id))];
    const whereC = ids.map((id) => `(id,eq,${id})`).join("~or");
    const r = await list<{ id: string; full_name: string | null }>("users", {
      where: whereC,
      fields: "id,full_name",
    });
    for (const u of r.list) coachById[u.id] = u.full_name ?? "Personal";
  }

  return (
    <AppShell title="Avisos" bottomNav={<ClienteNav />}>
      <div className="space-y-2">
        {reminders.length === 0 && (
          <div className="atlas-card-muted text-sm text-atlas-muted">
            Sem novidades por aqui.
          </div>
        )}
        {reminders.map((r) => (
          <form key={r.id} action={markRead} className="atlas-card">
            <input type="hidden" name="id" value={r.id} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell
                  className={r.read_at ? "text-atlas-muted" : "text-atlas-energy"}
                  size={16}
                />
                <div className={r.read_at ? "" : "font-semibold"}>{r.title}</div>
              </div>
              <span className="text-[11px] text-atlas-muted">{relativeTimePt(r.created_at)}</span>
            </div>
            {r.body && <p className="text-sm text-atlas-muted mt-1">{r.body}</p>}
            <div className="flex items-center justify-between mt-2 text-xs text-atlas-muted">
              <span>De: {coachById[r.coach_id] ?? "Personal"}</span>
              {!r.read_at && <button className="text-atlas-energy">Marcar lido</button>}
            </div>
          </form>
        ))}
      </div>
    </AppShell>
  );
}
