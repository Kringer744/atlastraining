import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { ClienteNav } from "@/components/app/ClienteNav";
import { SleepMonitor } from "@/components/app/SleepMonitor";
import { formatDateBR } from "@/lib/utils";
import { safeList } from "@/lib/safe";

export default async function SonoCliente() {
  const session = await requireUser();
  const { list: sessions } = await safeList<{
    id: string;
    started_at: string;
    duration_min: number;
    quality_score: number;
    noise_events: number;
  }>("sleep_sessions", {
    where: `(client_id,eq,${session.sub})`,
    sort: "-started_at",
    limit: 14,
  });

  return (
    <AppShell title="Modo Soneca" subtitle="Atlas observando seu sono" bottomNav={<ClienteNav />}>
      <SleepMonitor />

      {sessions.length > 0 && (
        <div className="atlas-card mt-4">
          <div className="text-[11px] uppercase tracking-wider text-atlas-muted mb-3">
            Suas últimas noites
          </div>
          <div className="space-y-2">
            {sessions.map((s) => {
              const h = Math.floor(Number(s.duration_min) / 60);
              const m = Math.round(Number(s.duration_min) % 60);
              const score = Number(s.quality_score);
              return (
                <div key={s.id} className="atlas-card-muted flex items-center gap-3">
                  <div className="text-3xl">{score >= 80 ? "🌟" : score >= 60 ? "🌙" : "😴"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">
                      {formatDateBR(s.started_at)}
                    </div>
                    <div className="text-xs text-atlas-muted">
                      {h}h {String(m).padStart(2, "0")} · {s.noise_events} eventos
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-atlas-energy">
                      {score}
                    </div>
                    <div className="text-[10px] text-atlas-muted uppercase tracking-wider">
                      score
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
