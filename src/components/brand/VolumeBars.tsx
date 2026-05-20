export function VolumeBars({
  values,
  labels = ["S", "T", "Q", "Q", "S", "S", "D"],
  highlightIndex,
}: {
  values: number[]; // 0..1
  labels?: string[];
  highlightIndex?: number;
}) {
  return (
    <div className="flex items-end gap-2 h-24">
      {values.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1 w-6">
          <div className="flex-1 w-full flex items-end">
            <div
              className={
                "w-full rounded-md " +
                (i === highlightIndex
                  ? "bg-atlas-energy shadow-[0_0_10px_rgba(198,255,0,0.55)]"
                  : "bg-white/15")
              }
              style={{ height: `${Math.max(8, v * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-atlas-muted">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
