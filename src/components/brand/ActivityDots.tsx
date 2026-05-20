export function ActivityDots({
  months = ["Jan", "Fev", "Mar"],
  data,
}: {
  months?: string[];
  data?: boolean[][]; // [month][day]
}) {
  // 3 months, ~14 dots wide per month
  const cols = 14;
  const rows = 6;
  const fallback = months.map(() =>
    Array.from({ length: cols * rows }, () => Math.random() < 0.18),
  );
  const matrix = data ?? fallback;
  return (
    <div className="atlas-card-muted">
      <div className="grid grid-cols-3 gap-4">
        {months.map((m, mi) => (
          <div key={m}>
            <div className="mb-2 text-[11px] uppercase tracking-wider text-atlas-muted">
              {m}
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: 4,
              }}
            >
              {matrix[mi].map((on, i) => (
                <span
                  key={i}
                  className={
                    "h-1.5 w-1.5 rounded-full " +
                    (on ? "bg-atlas-energy shadow-[0_0_6px_rgba(198,255,0,0.7)]" : "bg-white/10")
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
