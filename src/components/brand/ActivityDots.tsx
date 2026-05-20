const MONTH_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function toISODate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function ActivityDots({
  startDate,
  sessionDates,
}: {
  startDate?: string;
  sessionDates?: string[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = startDate ? new Date(startDate) : null;
  if (start) start.setHours(0, 0, 0, 0);

  const sessions = new Set(sessionDates ?? []);

  // últimos 3 meses inclusive o atual
  const months: { year: number; month: number }[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <div className="atlas-card-muted">
      <div className="grid grid-cols-3 gap-4">
        {months.map(({ year, month }) => {
          const lastDay = new Date(year, month + 1, 0).getDate();
          const offset = new Date(year, month, 1).getDay(); // 0 = dom
          const cells: Array<null | {
            iso: string;
            done: boolean;
            future: boolean;
            beforeStart: boolean;
          }> = [];
          for (let i = 0; i < offset; i++) cells.push(null);
          for (let d = 1; d <= lastDay; d++) {
            const date = new Date(year, month, d);
            const iso = toISODate(date);
            const future = date > today;
            const beforeStart = start ? date < start : false;
            cells.push({
              iso,
              done: sessions.has(iso),
              future,
              beforeStart,
            });
          }
          return (
            <div key={`${year}-${month}`}>
              <div className="mb-2 text-[11px] uppercase tracking-wider text-atlas-muted">
                {MONTH_PT[month]}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((c, i) =>
                  c === null ? (
                    <span key={i} className="h-2 w-2" />
                  ) : (
                    <span
                      key={i}
                      title={c.iso}
                      className={
                        "h-2 w-2 rounded-full " +
                        (c.done
                          ? "bg-atlas-energy shadow-[0_0_6px_rgba(198,255,0,0.7)]"
                          : c.beforeStart || c.future
                            ? "bg-white/5"
                            : "bg-white/15")
                      }
                    />
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
