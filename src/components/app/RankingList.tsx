import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

export type RankedUser = {
  id: string;
  name: string;
  score: number;
  scoreLabel: string; // ex: "1.250 XP" ou "12 alunos"
  subtitle?: string;
  badge?: string;
};

export function RankingList({
  users,
  myId,
  title,
  hint,
}: {
  users: RankedUser[];
  myId: string;
  title: string;
  hint?: string;
}) {
  const myIndex = users.findIndex((u) => u.id === myId);

  return (
    <div className="space-y-3">
      <div className="atlas-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-atlas-energy">
              Ranking
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">{title}</h1>
            {hint && <p className="text-xs text-atlas-muted mt-1">{hint}</p>}
          </div>
          <Trophy className="text-atlas-energy" size={32} />
        </div>
        {myIndex >= 0 && (
          <div className="mt-3 atlas-card-muted flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-atlas-muted">
                Sua posição
              </div>
              <div className="text-2xl font-bold text-atlas-energy">
                #{myIndex + 1}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-atlas-muted">
                {users[myIndex].badge ?? "Pontuação"}
              </div>
              <div className="text-lg font-bold">
                {users[myIndex].scoreLabel}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="atlas-card">
        {users.length === 0 && (
          <div className="text-sm text-atlas-muted text-center py-6">
            Sem competidores ainda — você é o pioneiro!
          </div>
        )}
        <div className="divide-y divide-white/5">
          {users.map((u, i) => {
            const isMe = u.id === myId;
            const medal =
              i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <div
                key={u.id}
                className={cn(
                  "flex items-center gap-3 py-2.5 px-1 rounded-xl transition",
                  isMe &&
                    "bg-atlas-energy/10 border border-atlas-energy/40 my-1 px-3 -mx-2",
                )}
              >
                <div
                  className={cn(
                    "w-10 text-center font-bold",
                    i < 3 ? "text-2xl" : "text-atlas-muted",
                  )}
                >
                  {medal ?? `#${i + 1}`}
                </div>
                <div
                  className={cn(
                    "h-10 w-10 rounded-full bg-atlas-balance flex items-center justify-center text-lg font-bold shrink-0",
                    isMe ? "text-atlas-energy" : "text-atlas-contrast",
                  )}
                >
                  {u.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-semibold truncate",
                      isMe && "text-atlas-energy",
                    )}
                  >
                    {u.name} {isMe && <span className="text-xs">(você)</span>}
                  </div>
                  {u.subtitle && (
                    <div className="text-xs text-atlas-muted truncate">
                      {u.subtitle}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={cn(
                      "font-bold",
                      isMe ? "text-atlas-energy" : "text-atlas-contrast",
                    )}
                  >
                    {u.scoreLabel}
                  </div>
                  {u.badge && (
                    <div className="text-[10px] text-atlas-muted uppercase tracking-wider">
                      {u.badge}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
