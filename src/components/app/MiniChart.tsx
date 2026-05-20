// SVG mini-charts puros (sem libs). Linha e barras.

export function LineChart({
  data,
  color = "#C6FF00",
  height = 80,
  showDots = true,
}: {
  data: { x: string; y: number | null }[];
  color?: string;
  height?: number;
  showDots?: boolean;
}) {
  const valid = data.filter((d) => d.y !== null) as { x: string; y: number }[];
  if (valid.length < 2) {
    return (
      <div className="text-xs text-atlas-muted text-center py-6">
        Sem dados suficientes
      </div>
    );
  }
  const W = 300;
  const H = height;
  const PAD = 10;
  const ys = valid.map((d) => d.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const range = maxY - minY || 1;
  const xStep = (W - PAD * 2) / (data.length - 1);

  const points = data.map((d, i) => {
    if (d.y === null) return null;
    const x = PAD + i * xStep;
    const y = H - PAD - ((d.y - minY) / range) * (H - PAD * 2);
    return { x, y, raw: d.y };
  });

  const path = points
    .filter((p) => p !== null)
    .map((p, idx) => (idx === 0 ? `M ${p!.x} ${p!.y}` : `L ${p!.x} ${p!.y}`))
    .join(" ");
  const area =
    path +
    ` L ${PAD + (data.length - 1) * xStep} ${H - PAD} L ${PAD} ${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lineFill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {showDots &&
        points.map((p, i) =>
          p === null ? null : (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
          ),
        )}
    </svg>
  );
}

export function BarChart({
  data,
  color = "#C6FF00",
  height = 80,
  highlightLast = false,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  highlightLast?: boolean;
}) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / max) * (height - 16));
        const isLast = highlightLast && i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="flex-1 w-full flex items-end">
              <div
                className="w-full rounded-md transition-all"
                style={{
                  height: `${h}px`,
                  background: color,
                  opacity: isLast ? 1 : 0.65,
                  boxShadow: isLast ? `0 0 8px ${color}80` : "none",
                }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
            <span className="text-[9px] text-atlas-muted">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
